# Admin Tools Documentation

This document outlines the administrative tools available in the system and how to configure and use them.

## User Profile Synchronization

The gamification system requires user profiles with proper usernames to display in leaderboards and other gamification components. The system includes tools to sync user data from Clerk to our database.

### Configuration

1. In your `.env` file, add the following variables:

```
# Comma-separated list of Clerk user IDs that have admin privileges
ADMIN_USER_IDS="user_id_1,user_id_2"

# Secret key for authorizing admin actions
ADMIN_SECRET="your_secure_random_string"
```

- To find a user's Clerk ID, check the Clerk dashboard or look at the URL when viewing a user's profile in the Clerk dashboard.
- Use a strong, random string for `ADMIN_SECRET`. You can generate one with a tool like `openssl rand -hex 32`.

### Available Admin Tools

#### Bulk User Synchronization

As an admin user (specified in `ADMIN_USER_IDS`), you can access a "Sync User Data" button on the leaderboard page that allows you to sync multiple user profiles at once.

1. Navigate to the leaderboard page at `/leaderboard`
2. If your user ID is in the `ADMIN_USER_IDS` list, you'll see a "Sync User Data" button
3. Click the button and enter the `ADMIN_SECRET` when prompted
4. Specify the maximum number of users to sync (default: 10)
5. The system will sync user data from Clerk to your database

**Note:** The sync process has a delay between user syncs to avoid hitting Clerk API rate limits.

#### API Endpoints

The following API endpoints are available for administrative tasks:

1. **Bulk User Sync**: `POST /api/admin/sync-users`
   - Request body: `{ "adminSecret": "your_secret", "limit": 10 }`
   - Response: List of synced users and status

2. **Single User Sync**: `POST /api/user/sync`
   - No request body needed
   - Current user will be synced

### Security Considerations

- Keep your `ADMIN_SECRET` secure and change it regularly
- In production, implement proper role-based access control instead of using a simple secret
- Monitor API usage to detect unauthorized access attempts
- Consider implementing rate limiting for admin endpoints

### Troubleshooting

If users are still showing as "User" in the leaderboard after syncing:

1. Check that the user has a username, first name, or email in Clerk
2. Verify that the sync process completed successfully
3. Check server logs for any errors during the sync process
4. Try syncing individual users with the `/api/user/sync` endpoint 