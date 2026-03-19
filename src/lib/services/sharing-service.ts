// ============================================
// Sharing Service
// Handles sharing of courses and study lists for network effects
// ============================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edbox.app';

export interface ShareableContent {
  type: 'course' | 'studylist' | 'learning-path';
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  creatorName?: string;
}

export interface ShareOptions {
  platform?: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'email' | 'copy' | 'study_circle' | 'direct_message' | 'native';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Generate shareable URL for content
 */
export function generateShareUrl(content: ShareableContent, options?: ShareOptions): string {
  let baseUrl = APP_URL;

  // Remove trailing slash if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // Build the content URL - using actual routes
  let contentUrl = '';
  switch (content.type) {
    case 'course':
      contentUrl = `${baseUrl}/pulse?type=COURSE&id=${content.id}`;
      break;
    case 'studylist':
      // Use the actual route that works: /tools/study-kit?id=...
      contentUrl = `${baseUrl}/tools/study-kit?id=${content.id}`;
      break;
    case 'learning-path':
      contentUrl = `${baseUrl}/learning-path/${content.id}`;
      break;
  }

  // Add UTM parameters for tracking
  const params = new URLSearchParams();
  if (options?.utmSource) params.append('utm_source', options.utmSource);
  if (options?.utmMedium) params.append('utm_medium', options.utmMedium);
  if (options?.utmCampaign) params.append('utm_campaign', options.utmCampaign);
  if (options?.platform) params.append('shared_via', options.platform);

  const queryString = params.toString();
  
  // For studylist, URL already has ?id=..., so append with &
  // For others, use ?
  if (content.type === 'studylist' && queryString) {
    return `${contentUrl}&${queryString}`;
  }
  
  return queryString ? `${contentUrl}?${queryString}` : contentUrl;
}

/**
 * Generate share text for social media
 */
export function generateShareText(content: ShareableContent): string {
  const emoji = content.type === 'course' ? '📚' : '📝';
  const typeLabel = content.type === 'course' ? 'Course' :
    content.type === 'studylist' ? 'Study List' : 'Learning Path';

  let text = `${emoji} Check out this ${typeLabel}: "${content.title}"`;

  if (content.creatorName) {
    text += ` by ${content.creatorName}`;
  }

  if (content.description) {
    const shortDesc = content.description.length > 100
      ? content.description.substring(0, 100) + '...'
      : content.description;
    text += `\n\n${shortDesc}`;
  }

  text += '\n\nLearn on EdBox 🚀';

  return text;
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(content: ShareableContent): void {
  const url = generateShareUrl(content, {
    platform: 'twitter',
    utmSource: 'twitter',
    utmMedium: 'social',
    utmCampaign: 'share'
  });

  const text = generateShareText(content);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  window.open(twitterUrl, '_blank', 'width=550,height=420');
}

/**
 * Share to Facebook
 */
export function shareToFacebook(content: ShareableContent): void {
  const url = generateShareUrl(content, {
    platform: 'facebook',
    utmSource: 'facebook',
    utmMedium: 'social',
    utmCampaign: 'share'
  });

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  window.open(facebookUrl, '_blank', 'width=550,height=420');
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(content: ShareableContent): void {
  const url = generateShareUrl(content, {
    platform: 'linkedin',
    utmSource: 'linkedin',
    utmMedium: 'social',
    utmCampaign: 'share'
  });

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  window.open(linkedInUrl, '_blank', 'width=550,height=420');
}

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp(content: ShareableContent): void {
  const url = generateShareUrl(content, {
    platform: 'whatsapp',
    utmSource: 'whatsapp',
    utmMedium: 'social',
    utmCampaign: 'share'
  });

  const text = generateShareText(content);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;

  window.open(whatsappUrl, '_blank');
}

/**
 * Share to Telegram
 */
export function shareToTelegram(content: ShareableContent): void {
  const url = generateShareUrl(content, {
    platform: 'telegram',
    utmSource: 'telegram',
    utmMedium: 'social',
    utmCampaign: 'share'
  });

  const text = generateShareText(content);
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

  window.open(telegramUrl, '_blank');
}

/**
 * Share via Email
 */
export function shareViaEmail(content: ShareableContent): void {
  const url = generateShareUrl(content, {
    platform: 'email',
    utmSource: 'email',
    utmMedium: 'email',
    utmCampaign: 'share'
  });

  const subject = `Check out: ${content.title}`;
  const body = `${generateShareText(content)}\n\n${url}`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoUrl;
}

/**
 * Copy link to clipboard
 */
export async function copyShareLink(content: ShareableContent): Promise<boolean> {
  const url = generateShareUrl(content, {
    platform: 'copy',
    utmSource: 'direct',
    utmMedium: 'copy_link',
    utmCampaign: 'share'
  });

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy link:', error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Share to Study Circle
 */
export async function shareToStudyCircle(
  content: ShareableContent,
  circleId: string,
  message?: string
): Promise<boolean> {
  const url = generateShareUrl(content, {
    platform: 'study_circle',
    utmSource: 'study_circle',
    utmMedium: 'internal',
    utmCampaign: 'share'
  });

  const shareText = message || `Check out this ${content.type}: "${content.title}" ${url}`;

  try {
    const response = await fetch(`/api/study-circles/${circleId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: shareText,
        shared_content: {
          type: content.type,
          id: content.id,
          title: content.title,
          description: content.description,
          imageUrl: content.imageUrl,
          url: url
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Failed to share to study circle:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to share to study circle:', error);
    return false;
  }
}

/**
 * Share via Direct Message
 */
export async function shareViaDirectMessage(
  content: ShareableContent,
  recipientId: string,
  message?: string
): Promise<boolean> {
  const url = generateShareUrl(content, {
    platform: 'direct_message',
    utmSource: 'direct_message',
    utmMedium: 'internal',
    utmCampaign: 'share'
  });

  const shareText = message || `Hey! Check out this ${content.type}: "${content.title}" ${url}`;

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId,
        message: shareText,
        shared_content: {
          type: content.type,
          id: content.id,
          title: content.title,
          description: content.description,
          imageUrl: content.imageUrl,
          url: url
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Failed to share via direct message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to share via direct message:', error);
    return false;
  }
}

/**
 * Use Web Share API if available (mobile)
 */
export async function shareNative(content: ShareableContent): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  const url = generateShareUrl(content, {
    platform: 'native',
    utmSource: 'native_share',
    utmMedium: 'mobile',
    utmCampaign: 'share'
  });

  try {
    await navigator.share({
      title: content.title,
      text: content.description || generateShareText(content),
      url: url
    });
    return true;
  } catch (error) {
    // User cancelled or share failed
    if ((error as Error).name !== 'AbortError') {
      console.error('Native share failed:', error);
    }
    return false;
  }
}

/**
 * Get user's study circles for sharing
 */
export async function getUserStudyCircles(): Promise<Array<{ id: string; name: string; member_count: number }>> {
  try {
    const response = await fetch('/api/study-circles');
    if (!response.ok) {
      console.error('Failed to fetch study circles:', response.status);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data.filter((circle: any) => circle.is_member) : [];
  } catch (error) {
    console.error('Failed to get study circles:', error);
    return [];
  }
}

/**
 * Get user's friends/contacts for direct messaging
 */
export async function getUserContacts(): Promise<Array<{ id: string; name: string; avatar?: string }>> {
  try {
    const response = await fetch('/api/messages/contacts');
    if (!response.ok) {
      console.error('Failed to fetch contacts:', response.status);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data.contacts) ? data.contacts : [];
  } catch (error) {
    console.error('Failed to get contacts:', error);
    return [];
  }
}

/**
 * Track share event (for analytics)
 */
export async function trackShare(
  content: ShareableContent,
  platform: string,
  userId?: string
): Promise<void> {
  try {
    const response = await fetch('/api/analytics/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: content.type,
        contentId: content.id,
        platform,
        userId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Failed to track share:', response.status);
    }
  } catch (error) {
    console.error('Failed to track share:', error);
    // Don't throw - tracking failure shouldn't break sharing
  }
}

/**
 * Get share count for content
 */
export async function getShareCount(contentType: string, contentId: string): Promise<number> {
  try {
    const response = await fetch(`/api/analytics/share-count?type=${encodeURIComponent(contentType)}&id=${encodeURIComponent(contentId)}`);
    if (!response.ok) {
      console.error('Failed to get share count:', response.status);
      return 0;
    }
    const data = await response.json();
    return typeof data.count === 'number' ? data.count : 0;
  } catch (error) {
    console.error('Failed to get share count:', error);
    return 0;
  }
}
