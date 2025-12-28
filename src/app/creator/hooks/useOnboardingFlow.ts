import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { LearningContext } from '../types';

export function useOnboardingFlow() {
  const router = useRouter();
  
  // State
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState<LearningContext | null>(null);
  const [timeAvailable, setTimeAvailable] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileContext, setFileContext] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [error, setError] = useState('');
  const [showContinue, setShowContinue] = useState(false);

  // Auto-advance logic
  useEffect(() => {
    const shouldShow = 
      (step === 1 && goal.length > 1) ||
      (step === 2 && context !== null) ||
      (step === 3 && timeAvailable !== null);
    
    setShowContinue(shouldShow);
  }, [step, goal.length, context, timeAvailable]);

  // Handlers
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
          setError('File size exceeds 10MB. Please upload in smaller batches or reduce file size.');
          return;
        }
        
        setUploadedFile(file);
        setIsExtracting(true);
        setError('');
        
        try {
          // Convert to base64 for transmission
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const fileContent = await base64Promise;
          
          // Call extraction API
          const response = await fetch('/api/coursecreation/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileContent,
              fileType: file.type,
              fileName: file.name
            })
          });

          if (!response.ok) throw new Error('Failed to extract context from file');
          
            const data = await response.json();
            if (data.success) {
              // Track file uploaded event
              posthog.capture('file_uploaded', {
                file_name: file.name,
                file_type: file.type,
                file_size_bytes: file.size,
                extraction_success: true,
              });
              // Only set goal if it's empty or just a placeholder
              // And avoid setting it to the messy extraction summary
              const friendlyGoal = `Course based on: ${file.name}`;
              if (!goal || goal.length < 3) {
                setGoal(friendlyGoal);
              }
              setFileContext(data.context);
            } else {


              throw new Error(data.error || 'Extraction failed');
            }
        } catch (err: any) {
          console.error('Extraction error:', err);
          setError('Failed to process file. You can still type your goal manually.');
          // Fallback to basic info
          setGoal(`Learning from: ${file.name}`);
        } finally {
          setIsExtracting(false);
        }
      }
    }, [goal.length]);

    const handleGenerate = useCallback(async () => {
      if (!goal || !context || !timeAvailable) {
        setError('Please complete all steps');
        return;
      }

      setIsGenerating(true);
      setError('');

      try {
        // Read file if uploaded
        let fileData;
        if (uploadedFile) {
          // Convert to base64 for reliable transmission of binary files
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(uploadedFile);
          });
          
          const content = await base64Promise;
          fileData = {
            name: uploadedFile.name,
            type: uploadedFile.type,
            content: content
          };
        }


      // Call API
      setGenerationStep('🧠 Analyzing your goal...');
      
        const response = await fetch('/api/learning-path/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal,
            context,
            timeAvailable,
            uploadedFile: fileData,
            extractedContext: fileContext
          })
        });

      if (!response.ok) {
        throw new Error('Failed to generate learning path');
      }

      const data = await response.json();

      if (data.success) {
        // Track course created event
        posthog.capture('course_created', {
          course_id: data.skillGraph.id,
          goal: goal,
          context: context,
          time_available: timeAvailable,
          has_uploaded_file: !!uploadedFile,
          file_type: uploadedFile?.type,
          skills_count: data.skillGraph.nodes?.length || 0,
        });

        router.push(`/learning-path/${data.skillGraph.id}`);
      } else {
        throw new Error(data.error || 'Generation failed');
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong 😢');
    } finally {
      setIsGenerating(false);
    }
  }, [goal, context, timeAvailable, uploadedFile, router]);

  const nextStep = useCallback(() => {
    // Track onboarding step completed event
    const stepNames: Record<number, string> = {
      1: 'goal_setting',
      2: 'learning_context',
      3: 'time_available',
    };
    posthog.capture('onboarding_step_completed', {
      step_number: step,
      step_name: stepNames[step] || `step_${step}`,
      goal: step === 1 ? goal : undefined,
      context: step === 2 ? context : undefined,
      time_available: step === 3 ? timeAvailable : undefined,
      has_uploaded_file: !!uploadedFile,
    });

    if (step < 3) {
      setStep(step + 1);
      setShowContinue(false);
    } else {
      handleGenerate();
    }
  }, [step, goal, context, timeAvailable, uploadedFile, handleGenerate]);

  const prevStep = useCallback(() => {
    setStep(step - 1);
  }, [step]);

  return {
    step,
    goal,
    context,
    timeAvailable,
    uploadedFile,
    isExtracting,
    isGenerating,
    generationStep,
    error,
    showContinue,
    setGoal,
    setContext,
    setTimeAvailable,
    handleFileUpload,
    handleGenerate,
    nextStep,
    prevStep
  };
}