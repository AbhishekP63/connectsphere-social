# ConnectSphere - Full-Stack Social Media Platform

A modern, feature-rich social media web application built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Authentication
- JWT-based authentication using Supabase Auth
- Secure login and signup
- Automatic profile creation on registration
- Protected routes and session management

### Core Features

#### Posts
- Create posts with text and images
- Like, comment, and share functionality
- Real-time updates using Supabase Realtime
- Feed showing posts from friends
- Individual post pages with comments

#### Stories
- Upload temporary stories (24-hour expiration)
- View stories from friends
- Automatic cleanup of expired stories
- Full-screen story viewer

#### Friends System
- Send friend requests
- Accept or reject incoming requests
- Cancel sent requests
- Search for users by name or username
- View friends list

#### Messaging
- Real-time private chat using Supabase Realtime
- Online/offline status indicators
- Message read status
- Conversation history
- Real-time message notifications

#### Profile Management
- Customizable profile with bio
- Profile picture upload
- Cover photo upload
- View user's posts
- Edit profile information

#### Notifications
- Real-time notifications for:
  - New likes on posts
  - New comments on posts
  - Friend requests
  - Friend request acceptance
  - New messages
- Unread notification counter

### UI/UX
- Clean, modern design using Tailwind CSS
- Fully responsive for mobile and desktop
- Dark mode toggle with persistent preference
- Smooth animations and transitions
- Loading states and error handling
- Optimistic UI updates

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

### Backend
- **Supabase** - Backend platform
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage for images
  - Row Level Security (RLS)

### Real-time Features
- **Supabase Realtime** - Real-time data synchronization
- Live updates for posts, comments, likes
- Real-time messaging
- Online/offline status tracking
- Live notifications

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── SignUp.tsx
│   ├── layout/
│   │   └── Navbar.tsx
│   ├── posts/
│   │   ├── CreatePost.tsx
│   │   └── PostCard.tsx
│   └── stories/
│       └── Stories.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/
│   ├── supabase.ts
│   └── storage.ts
├── pages/
│   ├── Feed.tsx
│   ├── Friends.tsx
│   ├── Messages.tsx
│   └── Profile.tsx
├── types/
│   └── database.ts
├── App.tsx
├── index.css
└── main.tsx
```

## Database Schema

### Tables
- **profiles** - User profiles with bio, pictures, etc.
- **posts** - User posts with content and images
- **comments** - Comments on posts
- **likes** - Likes on posts
- **friendships** - Friend connections and requests
- **messages** - Private messages between users
- **stories** - Temporary 24-hour stories
- **notifications** - User notifications
- **user_status** - Online/offline status

### Storage Buckets
- **profile-pictures** - User profile photos
- **cover-photos** - User cover photos
- **post-images** - Images attached to posts
- **stories** - Story images

## Security

All tables implement Row Level Security (RLS) policies:
- Users can only modify their own data
- Posts, comments, and likes are visible only to friends
- Messages are private between sender and recipient
- Stories are visible only to friends
- Profiles are publicly viewable but only editable by owner

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Features Explained

### Real-time Updates
The application uses Supabase's real-time subscriptions to provide live updates across all features. When a user creates a post, likes a comment, or sends a message, all connected clients receive instant updates without page refreshes.

### Dark Mode
The application includes a fully functional dark mode that persists across sessions using localStorage. All components are styled to support both light and dark themes with smooth transitions.

### Image Uploads
All images are stored in Supabase Storage with appropriate access policies. Profile pictures and cover photos are publicly accessible, while post images and stories are restricted based on friendship status.

### Friendship System
Users can search for others, send friend requests, and manage their connections. The feed and stories are filtered to show content only from accepted friends, creating a private social network experience.

### Stories
Stories automatically expire after 24 hours. The database includes a timestamp-based filter that only shows non-expired stories, and storage cleanup can be implemented as needed.

## License

MIT
