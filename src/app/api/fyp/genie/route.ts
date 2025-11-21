'use server'
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { NextResponse, type NextRequest } from "next/server";
import {FeedItem, QuizFeedItem, ArticleFeedItem, FactFeedItem, ChallengeFeedItem, StoryFeedItem} from "../../../fyp/types";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { item }: { item: FeedItem } = body;

        if (!item) {
            return NextResponse.json({ error: 'Feed item is required.' }, { status: 400 });
        }

        const ai = new GoogleGenAI(process.env.API_KEY as string);

        let contentPrompt = '';
        switch (item.type) {
            case 'quiz':
                const quizItem = item as QuizFeedItem;
                contentPrompt = `The user is on a quiz card. The question is: "${quizItem.title}". The options are: ${quizItem.options.join(', ')}. The correct answer is "${quizItem.answer}". Please explain why "${quizItem.answer}" is the correct answer in an encouraging and easy-to-understand way.`;
                break;
            case 'article':
                const articleItem = item as ArticleFeedItem;
                const articleText = articleItem.full_article_content || articleItem.summary;
                contentPrompt = `The user is on an article card titled "${articleItem.title}". Here is the content: "${articleText}". Please summarize the 3 most important key points from this article for easy digestion. Use bullet points.`;
                break;
            /* case 'video':
                const videoItem = item as VideoFeedItem;
                contentPrompt = `The user is on a video card titled "${videoItem.title}". The video is described as: "${videoItem.prompt}". Please provide a short, engaging textual summary of what this video likely contains, as if you've watched it.`;
                break; */
            case 'fact':
                const factItem = item as FactFeedItem;
                contentPrompt = `The user is on a fact card. The fact is: "${factItem.title}". The current explanation is: "${factItem.explanation}". Please elaborate on this fact, providing some extra interesting details, context, or related fun facts.`;
                break;
            case 'challenge':
                const challengeItem = item as ChallengeFeedItem;
                contentPrompt = `The user is on a challenge card. The riddle is: "${challengeItem.question}". The answer is "${challengeItem.answer}". Please explain the answer to this riddle in a fun and clever way.`;
                break;
            case 'story':
                const storyItem = item as StoryFeedItem;
                const storyText = storyItem.slides.map(s => s.text).join(' ');
                contentPrompt = `The user is on a story card titled "${storyItem.title}". The story is about: "${storyText}". Provide some extra interesting context or a related fact about the main subject of the story.`;
                break;
        }

        const prompt = `You are Genie, a friendly and knowledgeable AI learning companion in the EdBox app. A user has asked for more information about the content they are viewing. Provide a concise, helpful, and engaging response.
        
        Here is the context:
        ${contentPrompt}`;

        const result: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const explanation = result.text ?? "";
        return NextResponse.json({ explanation });

    } catch (error) {
        console.error("Error in Genie API route:", error);
        return NextResponse.json({ error: 'Failed to get explanation.' }, { status: 500 });
    }
}
