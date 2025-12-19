# EdBox Sharing System Documentation

## Overview

The EdBox sharing system enables users to share courses, study lists, and learning paths across multiple platforms to boost network effects and grow the learning community.

## Features

### 1. **Multi-Platform Sharing**
- Twitter/X
- Facebook
- LinkedIn
- WhatsApp
- Telegram
- Email
- Direct Link Copy
- Native Mobile Share (iOS/Android)

### 2. **Smart Tracking**
- UTM parameters for analytics
- Share event tracking
- Platform-specific metrics
- User attribution

### 3. **Social Media Optimization**
- Open Graph meta tags
- Twitter Card support
- Structured data (JSON-LD)
- Rich preview generation

### 4. **Network Effects**
- Share count display
- Social proof indicators
- Viral loop optimization
- Community growth metrics

## Components

### ShareButton Component
```tsx
import ShareButton from '@/components/ShareButton';

<ShareButton
  content={{
    type: 'course',
    id: 'course-123',
    title: 'Introduction to Python',
    description: 'Learn Python from scratch',
    imageUrl: '/courses/python.jpg',
    creatorName: 'CodeWizard'
  }}
  userId={user.id}
  variant="button" // 'button' | 'icon' | 'minimal'
  size="md" // 'sm' | 'md' | 'lg'
  showCount={true}
/>
```

### ShareModal Component
```tsx
import ShareModal, { useShareModal } from '@/components/ShareModal';

const { isOpen, content, openShareModal, closeShareModal } = useShareModal();

// Open modal
openShareModal({
  type: 'course',
  id: 'course-123',
  title: 'Introduction to Python',
  description: 'Learn Python from scratch'
});

// Render modal
<ShareModal
  isOpen={isOpen}
  onClose={closeShareModal}
  content={content}
  userId={user.id}
/>
```

### QuickShareButtons Component
```tsx
import { QuickShareButtons } from '@/components/ShareButton';

<QuickShareButtons
  content={shareableContent}
  userId={user.id}
  className="justify-center"
/>
```

## Services

### Sharing Service
```typescript
import {
  generateShareUrl,
  shareToTwitter,
  shareToFacebook,
  copyShareLink,
  trackShare
} from '@/lib/services/sharing-service';

// Generate shareable URL
const url = generateShareUrl(content, {
  platform: 'twitter',
  utmSource: 'twitter',
  utmMedium: 'social',
  utmCampaign: 'share'
});

// Share to platform
shareToTwitter(content);

// Copy link
const success = await copyShareLink(content);

// Track share event
await trackShare(content, 'twitter', userId);
```

## Database Schema

### share_events Table
```sql
CREATE TABLE share_events (
    id UUID PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    content_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    shared_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE
);
```

### share_statistics View
```sql
CREATE VIEW share_statistics AS
SELECT 
    content_type,
    content_id,
    COUNT(*) as total_shares,
    COUNT(DISTINCT user_id) as unique_sharers,
    COUNT(CASE WHEN platform = 'twitter' THEN 1 END) as twitter_shares,
    -- ... more platform counts
FROM share_events
GROUP BY content_type, content_id;
```

## API Endpoints

### Track Share Event
```
POST /api/analytics/share
Body: {
  contentType: 'course',
  contentId: 'course-123',
  platform: 'twitter',
  userId: 'user-456',
  timestamp: '2025-01-19T...'
}
```

### Get Share Count
```
GET /api/analytics/share-count?type=course&id=course-123
Response: {
  count: 42,
  contentType: 'course',
  contentId: 'course-123'
}
```

## Open Graph Meta Tags

### Generate OG Tags
```typescript
import { generateOGTags, generateNextMetadata } from '@/lib/utils/og-meta';

// For Next.js metadata API
export async function generateMetadata({ params }) {
  const content = await fetchContent(params.id);
  return generateNextMetadata(content);
}

// Manual generation
const ogTags = generateOGTags(content);
```

## Integration Examples

### Course Page Integration
```tsx
import ShareButton from '@/components/ShareButton';
import ShareModal, { useShareModal } from '@/components/ShareModal';

export default function CoursePage() {
  const { isOpen, content, openShareModal, closeShareModal } = useShareModal();
  
  const shareableContent = {
    type: 'course',
    id: courseId,
    title: course.title,
    description: course.description,
    imageUrl: course.imageUrl,
    creatorName: course.creator
  };

  return (
    <div>
      {/* Header with share button */}
      <div className="flex justify-between">
        <h1>{course.title}</h1>
        <ShareButton
          content={shareableContent}
          userId={user.id}
          variant="icon"
          showCount={true}
        />
      </div>

      {/* Share section */}
      <div className="share-section">
        <h3>Enjoying this course?</h3>
        <ShareButton
          content={shareableContent}
          userId={user.id}
          variant="button"
        />
        <button onClick={() => openShareModal(shareableContent)}>
          More Options
        </button>
      </div>

      {/* Share modal */}
      <ShareModal
        isOpen={isOpen}
        onClose={closeShareModal}
        content={content || shareableContent}
        userId={user.id}
      />
    </div>
  );
}
```

### Learning Path Integration
```tsx
const shareableContent = {
  type: 'learning-path',
  id: pathId,
  title: path.goal,
  description: `Master ${path.goal} with this personalized learning path`,
  creatorName: user.name
};

<ShareButton
  content={shareableContent}
  userId={user.id}
  variant="minimal"
/>
```

## UTM Parameters

All shared links include UTM parameters for tracking:

- `utm_source`: Platform (twitter, facebook, linkedin, etc.)
- `utm_medium`: Medium (social, email, copy_link)
- `utm_campaign`: Campaign (share)
- `shared_via`: Specific platform identifier

Example URL:
```
https://edbox-weld.vercel.app/courses/123?utm_source=twitter&utm_medium=social&utm_campaign=share&shared_via=twitter
```

## Analytics & Metrics

### Track Share Performance
```typescript
// Get share count
const count = await getShareCount('course', 'course-123');

// Query share statistics
const { data } = await supabase
  .from('share_statistics')
  .select('*')
  .eq('content_type', 'course')
  .eq('content_id', 'course-123')
  .single();

console.log({
  totalShares: data.total_shares,
  uniqueSharers: data.unique_sharers,
  twitterShares: data.twitter_shares,
  facebookShares: data.facebook_shares
});
```

## Best Practices

### 1. **Placement**
- Add share buttons in prominent locations
- Include in course completion flows
- Show after positive interactions
- Display in user profiles

### 2. **Messaging**
- Use encouraging copy
- Highlight community benefits
- Show social proof (share counts)
- Personalize when possible

### 3. **Timing**
- After course completion
- After achieving milestones
- When users express satisfaction
- In email notifications

### 4. **Incentives**
- Consider XP rewards for sharing
- Unlock features for referrals
- Gamify sharing achievements
- Create sharing challenges

## Network Effects Strategy

### Viral Loop
1. User completes course
2. Prompted to share achievement
3. Friends see shared content
4. Friends sign up and enroll
5. New users complete and share
6. Loop continues

### Growth Metrics
- **K-Factor**: Viral coefficient (invites per user)
- **Conversion Rate**: Shared link → Sign up
- **Time to Share**: Days until first share
- **Share Frequency**: Shares per active user

### Optimization
- A/B test share button placement
- Test different copy variations
- Optimize for mobile sharing
- Improve social previews
- Track platform performance

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://edbox-weld.vercel.app/
```

## Migration

Run the database migration:
```bash
supabase migration up
```

Or manually execute:
```bash
psql -f supabase/migrations/20250119_create_share_events_table.sql
```

## Testing

### Manual Testing
1. Share to each platform
2. Verify UTM parameters
3. Check social previews
4. Test mobile native share
5. Verify tracking works

### Automated Testing
```typescript
import { generateShareUrl, copyShareLink } from '@/lib/services/sharing-service';

describe('Sharing Service', () => {
  it('generates correct share URL', () => {
    const url = generateShareUrl({
      type: 'course',
      id: '123',
      title: 'Test Course'
    });
    expect(url).toContain('/courses/123');
  });

  it('includes UTM parameters', () => {
    const url = generateShareUrl(content, {
      platform: 'twitter',
      utmSource: 'twitter'
    });
    expect(url).toContain('utm_source=twitter');
  });
});
```

## Troubleshooting

### Share buttons not working
- Check if `NEXT_PUBLIC_APP_URL` is set
- Verify user authentication
- Check browser console for errors

### Social previews not showing
- Verify Open Graph meta tags
- Use Facebook Debugger tool
- Check Twitter Card Validator
- Ensure images are accessible

### Tracking not recording
- Check database permissions
- Verify API endpoints are accessible
- Check Supabase RLS policies
- Review browser network tab

## Future Enhancements

- [ ] QR code generation for offline sharing
- [ ] Referral reward system
- [ ] Share leaderboards
- [ ] Custom share messages
- [ ] Share templates
- [ ] Embed codes for websites
- [ ] Share analytics dashboard
- [ ] A/B testing framework
- [ ] Social media scheduling
- [ ] Influencer partnerships

## Support

For issues or questions:
- Check documentation
- Review example implementations
- Test in development environment
- Contact development team

---

**Last Updated**: January 19, 2025
**Version**: 1.0.0
