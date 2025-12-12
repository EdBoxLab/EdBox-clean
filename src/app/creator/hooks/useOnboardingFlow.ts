import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LearningContext } from '../types';

export function useOnboardingFlow() {
  const router = useRouter();
  
  // State
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState<LearningContext | null>(null);
  const [timeAvailable, setTimeAvailable] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [error, setError] = useState('');
  const [showContinue, setShowContinue] = useState(false);

  // Auto-advance logic
  useEffect(() => {
    const shouldShow = 
      (step === 1 && goal.length > 10) ||
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
      
      const text = await file.text();
      setGoal(text.substring(0, 500));
    }
  }, []);

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
        const content = await uploadedFile.text();
        fileData = {
          name: uploadedFile.name,
          content: content.substring(0, 4000)
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
          uploadedFile: fileData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate learning path');
      }

      const data = await response.json();

      if (data.success) {
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
    if (step < 3) {
      setStep(step + 1);
      setShowContinue(false);
    } else {
      handleGenerate();
    }
  }, [step, handleGenerate]);

  const prevStep = useCallback(() => {
    setStep(step - 1);
  }, [step]);

  return {
    step,
    goal,
    context,
    timeAvailable,
    uploadedFile,
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