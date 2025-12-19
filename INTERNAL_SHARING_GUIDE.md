# Internal Sharing System - Study Circles & Direct Messages

## Overview

The enhanced sharing system now includes **internal social features** to boost engagement within your EdBox community:

- **Study Circle Sharing** - Share content directly to your study circles
- **Direct Messaging** - Send content to friends via the messaging system
- **Network Effects** - Keep users engaged within the platform

## Features

### 1. **Study Circle Integration**
- Share courses, learning paths, and study lists to any circle you're a member of
- Add custom messages when sharing
- Real-time sharing to circle chat
- Track engagement within circles

### 2. **Direct Messaging**
- Send content directly to friends and contacts
- Personalized sharing messages
- Integration with existing messaging system
- Contact discovery from circles and conversations

### 3. **Enhanced Share Modal**
- Tabbed interface: Study Circles | Direct Messages | External
- Visual contact/circle selection
- Custom message composition
- Loading states and success feedback

## Usage Examples

### Basic Share Modal with Internal Options

```tsx
import ShareModal, { useShareModal } from '@/components/ShareModal';

function CoursePage() {
  const { isOpen, content, openShareModal, closeShareModal } = useShareModal();
  
  const shareableContent = {
    type: 'course',
    id: 'course-123',
    title: 'Introduction to Python',
    description: 'Learn Python from scratch',
    imageUrl: '/courses/python.jpg',
    creatorName: 'CodeWizard'
  };

  return (
    <div>
      <button onClick={() => openShareModal(shareableContent)}>
        Share to Study Circle
      </button>

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

### Quick Circle Share Component

```tsx
import { QuickCircleShare } from '@/components/InternalShareButtons';

function CourseCard({ course, user, circleId, circleName }) {
  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      
      <QuickCircleShare
        content={{
          type: 'course',
          id: course.id,
          title: course.title,
          description: course.description
        }}
        userId={user.id}
        circleId={circleId}
        circleName={circleName}
        onSuccess={() => alert('Shared successfully!')}
      />
    </div>
  );
}
```

### Direct Message Share

```tsx
import { QuickMessageShare } from '@/components/InternalShareButtons';

function ShareToFriend({ content, friendId, friendName }) {
  return (
    <QuickMessageShare
      content={content}
      userId={user.id}
      recipientId={friendId}
      recipientName={friendName}
      onSuccess={() => console.log('Message sent!')}
    />
  );
}
```

## API Integration

### Share to Study Circle

```typescript
import { shareToStudyCircle } from '@/lib/services/sharing-service';

const success = await shareToStudyCircle(
  {
    type: 'course',
    id: 'course-123',
    title: 'Python Basics',
    description: 'Learn Python programming'
  },
  'circle-456',
  'Check out this amazing course I just completed! 🚀'
);
```

### Send Direct Message

```typescript
import { shareViaDirectMessage } from '@/lib/services/sharing-service';

const success = await shareViaDirectMessage(
  {
    type: 'learning-path',
    id: 'path-789',
    title: 'Web Development Path',
    description: 'Complete web dev curriculum'
  },
  'user-123',
  'Hey! This learning path looks perfect for you 😊'
);
```

### Get User's Study Circles

```typescript
import { getUserStudyCircles } from '@/lib/services/sharing-service';

const circles = await getUserStudyCircles();
// Returns: [{ id: 'circle-1', name: 'Python Study Group', member_count: 15 }]
```

### Get User's Contacts

```typescript
import { getUserContacts } from '@/lib/services/sharing-service';

const contacts = await getUserContacts();
// Returns: [{ id: 'user-1', name: 'John Doe', avatar: 'avatar.jpg' }]
```

## Database Schema Updates

### Messages Table Enhancement

```sql
-- Add shared_content column to messages table
ALTER TABLE messages ADD COLUMN shared_content JSONB;

-- Index for shared content queries
CREATE INDEX idx_messages_shared_content ON messages USING GIN (shared_content);
```

### Share Events Tracking

The existing `share_events` table now tracks internal sharing:

```sql
-- Internal sharing platforms
INSERT INTO share_events (content_type, content_id, platform, user_id)
VALUES ('course', 'course-123', 'study_circle', 'user-456');

INSERT INTO share_events (content_type, content_id, platform, user_id)
VALUES ('course', 'course-123', 'direct_message', 'user-789');
```

## UI Components

### Enhanced Share Modal

The ShareModal now includes three tabs:

1. **Study Circles Tab**
   - Lists user's study circles
   - Custom message input
   - Member count display
   - One-click sharing

2. **Direct Messages Tab**
   - Lists contacts from conversations and circles
   - Avatar display
   - Custom message input
   - Send to multiple friends

3. **External Tab**
   - Traditional social media sharing
   - Copy link functionality
   - Platform-specific sharing

### Share Button Updates

The ShareButton dropdown now includes:
- "Share to Study Circle" option
- "Send to Friend" option
- All existing external platforms

## Network Effects Strategy

### Internal Viral Loops

1. **Circle Sharing Loop**
   - User completes course → Shares to study circle → Circle members see and enroll → They complete and share → Loop continues

2. **Friend Recommendation Loop**
   - User discovers great content → Messages friends directly → Friends join and discover more → They recommend to their friends

3. **Cross-Circle Pollination**
   - Popular content shared across multiple circles → Increases visibility → Drives enrollment → Creates community buzz

### Engagement Metrics

Track internal sharing effectiveness:

```sql
-- Internal vs External sharing ratio
SELECT 
  platform,
  COUNT(*) as shares,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM share_events 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY platform;

-- Circle sharing effectiveness
SELECT 
  se.content_id,
  COUNT(DISTINCT se.user_id) as sharers,
  COUNT(DISTINCT cm.user_id) as circle_members_reached
FROM share_events se
JOIN messages m ON m.shared_content->>'id' = se.content_id
JOIN circle_members cm ON cm.circle_id = m.circle_id
WHERE se.platform = 'study_circle'
GROUP BY se.content_id;
```

## Best Practices

### 1. **Contextual Sharing**
- Show study circle sharing prominently in course completion flows
- Suggest relevant circles based on course topic
- Pre-fill sharing messages with course achievements

### 2. **Social Proof**
- Show "X friends completed this course" 
- Display circle activity: "3 people in your Python circle shared this"
- Highlight trending content within circles

### 3. **Personalization**
- Suggest friends who might be interested based on their learning history
- Recommend circles based on course topics
- Customize sharing messages based on relationship

### 4. **Gamification**
- Award XP for sharing within circles
- Create sharing challenges: "Share 5 courses this week"
- Leaderboards for most helpful sharers in circles

## Implementation Checklist

- [x] Enhanced sharing service with internal methods
- [x] ShareModal with tabbed interface
- [x] Study circle integration
- [x] Direct messaging integration
- [x] Contacts API endpoint
- [x] Internal sharing components
- [x] Course page integration
- [ ] Learning path integration
- [ ] Study list integration
- [ ] Circle activity feed
- [ ] Sharing analytics dashboard
- [ ] Push notifications for shares
- [ ] Email notifications for shares

## Future Enhancements

### Phase 2: Advanced Features
- [ ] **Smart Recommendations**: AI-powered friend/circle suggestions
- [ ] **Batch Sharing**: Share to multiple circles at once
- [ ] **Scheduled Sharing**: Share content at optimal times
- [ ] **Share Templates**: Pre-written messages for different content types

### Phase 3: Community Features
- [ ] **Circle Leaderboards**: Most active sharers
- [ ] **Content Curation**: Circle admins can feature shared content
- [ ] **Study Parties**: Coordinate group learning sessions
- [ ] **Achievement Sharing**: Automatic sharing of milestones

### Phase 4: Advanced Analytics
- [ ] **Influence Tracking**: Who drives the most engagement
- [ ] **Content Performance**: Which content spreads fastest
- [ ] **Network Analysis**: Mapping learning influence networks
- [ ] **Predictive Sharing**: Suggest optimal sharing strategies

## Testing

### Manual Testing Checklist

1. **Study Circle Sharing**
   - [ ] Share course to circle
   - [ ] Verify message appears in circle chat
   - [ ] Test custom message functionality
   - [ ] Check sharing analytics

2. **Direct Messaging**
   - [ ] Send course to friend
   - [ ] Verify message appears in inbox
   - [ ] Test with custom message
   - [ ] Check contact discovery

3. **UI/UX Testing**
   - [ ] Modal tabs work correctly
   - [ ] Loading states display properly
   - [ ] Success feedback shows
   - [ ] Mobile responsiveness

### Automated Testing

```typescript
// Test study circle sharing
describe('Study Circle Sharing', () => {
  it('should share content to circle', async () => {
    const result = await shareToStudyCircle(mockContent, 'circle-123');
    expect(result).toBe(true);
  });

  it('should track sharing event', async () => {
    await shareToStudyCircle(mockContent, 'circle-123');
    // Verify tracking call was made
  });
});

// Test direct messaging
describe('Direct Message Sharing', () => {
  it('should send content via DM', async () => {
    const result = await shareViaDirectMessage(mockContent, 'user-456');
    expect(result).toBe(true);
  });
});
```

## Support & Troubleshooting

### Common Issues

1. **Sharing not working**
   - Check user authentication
   - Verify circle membership
   - Check API permissions

2. **Contacts not loading**
   - Verify messages table structure
   - Check profile relationships
   - Review API response format

3. **Modal not opening**
   - Check React state management
   - Verify component imports
   - Review console for errors

---

This internal sharing system creates powerful network effects by keeping users engaged within your platform while making it easy to discover and share great learning content! 🚀