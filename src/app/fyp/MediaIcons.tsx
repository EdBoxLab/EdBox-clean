import React from 'react';

export const PlayIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

export const PauseIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

export const ListenIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3a1 1 0 011 1v.5a3.5 3.5 0 01-7 0V4a1 1 0 011-1h5z" />
      <path fillRule="evenodd" d="M4 8.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zM4.5 11a.5.5 0 000 1h11a.5.5 0 000-1h-11zM4 13.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zM4.5 16a.5.5 0 000 1h11a.5.5 0 000-1h-11z" clipRule="evenodd" />
    </svg>
);


export const ArrowUpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);

export const BookOpenIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0014.5 16c1.255 0 2.443-.29 3.5-.804v-10A7.968 7.968 0 0014.5 4z" />
  </svg>
);

export const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const SpinnerIcon: React.FC = () => (
  <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const BookmarkIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    {filled ? (
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    ) : (
      <path fillRule="evenodd" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4zm2 2v10l3-1.5 3 1.5V6H7z" clipRule="evenodd" />
    )}
  </svg>
);

export const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

export const TrendingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45.385c-.345.675-.5 1.425-.5 2.224v.08c-.26.16-.5.37-.684.617c-.184.247-.35.54-.466.874c-.116.334-.176.704-.176 1.096c0 .65.16 1.28.465 1.82c.305.54.75.994 1.27 1.327c.52.332 1.12.556 1.77.652c.65.096 1.28-.026 1.82-.24c.54-.214.994-.52 1.327-.957c.333-.437.556-1.01.652-1.653c.096-.64-.026-1.28-.24-1.82c-.214-.54-.52-.994-.957-1.327c-.437-.333-1.01-.556-1.653-.652c-.345-.052-.71-.067-1.076-.067c-.11 0-.218.002-.324.006c.24-.26.43-.56.57-.89c.14-.33.22-.69.22-1.09c0-.65-.16-1.28-.465-1.82c-.305-.54-.75-.994-1.27-1.327a1 1 0 00-.385-1.45z" clipRule="evenodd" />
    </svg>
);

export const ThumbsUpIcon: React.FC<{ filled?: boolean, className?: string }> = ({ filled = false, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    {filled ? (
        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.943-.684l1.714-6.857A1 1 0 0015.021 9h-3.956V4.438a1 1 0 00-1.581-.823l-4.243 3.535A1 1 0 006 8v2.333z" />
    ) : (
        <path fillRule="evenodd" d="M18 10a1 1 0 01-1 1h-3.364l.714 3.429A1 1 0 0113.364 16H8a1 1 0 01-1-1v-5.467l-4.243-3.536A1 1 0 013.243 5H5a1 1 0 011 1v4.5a.5.5 0 00.5.5h3.5a.5.5 0 00.5-.5V6a1 1 0 011-1h2a1 1 0 110 2h-1.081l-.5 2H17a1 1 0 011 1zM2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6z" clipRule="evenodd" />
    )}
  </svg>
);

export const ThumbsDownIcon: React.FC<{ filled?: boolean, className?: string }> = ({ filled = false, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    {filled ? (
        <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.636a1 1 0 00-.943.684l-1.714 6.857A1 1 0 004.979 11h3.956V15.562a1 1 0 001.581.823l4.243-3.535A1 1 0 0014 12V9.667z" />
    ) : (
        <path fillRule="evenodd" d="M2 10a1 1 0 011-1h3.364l-.714-3.429A1 1 0 016.636 4H12a1 1 0 011 1v5.467l4.243 3.536A1 1 0 0116.757 15H15a1 1 0 01-1-1v-4.5a.5.5 0 00-.5-.5h-3.5a.5.5 0 00-.5.5V14a1 1 0 01-1 1h-2a1 1 0 110-2h1.081l.5-2H3a1 1 0 01-1-1zM18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6z" clipRule="evenodd" />
    )}
  </svg>
);

export const TagCloseIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const VideoErrorIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

export const GenieMagicIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.528l-.259-1.035a3.375 3.375 0 00-2.456-2.456L13.15 16.5l1.035-.259a3.375 3.375 0 002.456-2.456l.259-1.035.259 1.035a3.375 3.375 0 002.455 2.456l1.036.259-1.035.259a3.375 3.375 0 00-2.455 2.456l-.259 1.035z" />
    </svg>
);

export const ChevronLeftIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export const ChevronRightIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export const FinishIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);