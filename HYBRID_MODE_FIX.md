// CRITICAL FIX for Hybrid Mode Issue
//
// Problem: After upload + page reload, the StoreContext was:
// 1. Loading data from server (correct)
// 2. Then auto-saving it back to localStorage (BUG!)
//
// Root Cause: The save-to-localStorage hooks run whenever grows/profiles change,
// even when the change comes from the server fetch.
//
// Solution: Add a flag to track if we're currently loading from server,
// and skip localStorage saves during that time.
//
// Implementation:
// 1. Add `isLoadingFromServer` state
// 2. Set it to true before fetching from server
// 3. Set it to false after fetch completes
// 4. In the localStorage save hooks, check: if (isLoadingFromServer) return;
//
// This ensures that server data never gets written back to localStorage,
// which would keep the user stuck in Hybrid mode forever.
