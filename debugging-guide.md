# Real-Time Features Debugging Guide

This guide will help you test and debug the real-time features using the extensive logging we've added.

## Testing Steps

1. **Test Real-Time Comments**
   - Open a course chapter in two different browsers or browser tabs
   - Open the browser console in both tabs (F12)
   - In one tab, add a comment and check:
     - The console log in the posting tab should show `Triggering Pusher event: comment:new`
     - The console log in the other tab should show `Received comment:new event`
     - The comment should appear in both tabs without refreshing

2. **Test Presence Feature**
   - Open a course chapter in two different browsers (e.g., Chrome and Firefox)
   - Ensure you're logged in with different accounts in each browser
   - Check the console logs:
     - `Presence subscription successful` should appear
     - `Member added to presence channel` should show when the second browser joins
     - The UI should show that another user is viewing the chapter

3. **Test Typing Indicators**
   - Open a course chapter in two different browsers with different accounts
   - Start typing in the comment field in one browser
   - Check the console logs:
     - The typing browser should show `Sending typing indicator for user`
     - The other browser should show `Received typing event`
     - The "user is typing" indicator should appear in the other browser

## Debugging Common Issues

### Connection Issues
- Check for `Connected to Pusher successfully!` message
- If not showing, verify the `.env` variables are correct
- Try temporarily hardcoding the key and cluster directly in the client initialization

### Channel Subscription Issues
- Look for `Successfully subscribed to` logs
- If you see `Failed to subscribe to`, the problem is likely with:
  - The channel name format (e.g., incorrect prefix)
  - Authentication for private/presence channels

### Authorization Issues
- For private/presence channels, check the auth endpoint logs
- Look for `Pusher auth endpoint called` and `Auth successful`
- If you see `Auth failed`, verify that the user is authenticated

### Event Issues
- Verify events are triggered: `Pusher event triggered successfully`
- Verify events are received: `Received comment:new event`
- If events are triggered but not received, check:
  - Channel names match exactly
  - Event names match exactly
  - No typos in any of the strings

## Simplification Test

If issues persist, try this simplified approach:

1. **Try Simple Public Channels First**
   - Modify `TypingIndicator.tsx` to use a regular channel (uncomment the line with `chapter-${chapterId}-typing`)
   - Modify `typing/route.ts` similarly
   - Test if basic events work without authentication

2. **Check Pusher Dashboard**
   - Go to your Pusher dashboard (pusher.com)
   - Open the Debug Console
   - Watch for events in real-time when you perform actions

3. **Verify the Correct App**
   - Make sure you're using the correct Pusher app credentials
   - Check that the app is active and on the correct plan

## After Debugging

Once you've identified and fixed the issues:
1. Remove the debugging console logs (or comment them out)
2. Restore any temporary changes made for debugging
3. Ensure all features are working correctly in production mode 