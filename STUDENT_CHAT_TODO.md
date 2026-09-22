# Student Chat Todo

The student chat flow has been temporarily disabled. To re-enable it, search for `TODO: Re-enable student chat` or revert the following changes:

1. **`app/page.tsx`**: Restore the redirect so that if `role === 'student'`, they go to `/chat/new` instead of `/student/dashboard`.
2. **`context/AuthContext.tsx`**: Restore the login redirect to push students to `/chat/new` instead of `/${userPrefix}/dashboard`.
3. **`components/layout/Sidebar.tsx`**: Remove the `role !== 'student'` checks from the "New Chat" button and the `SidebarRecentChats` component.
4. **`app/student/questions/[subjectId]/[paperId]/PaperQuestionsClient.tsx`**: Uncomment the "Study this paper in chat" button.
5. **`components/questions/SharedPaperQuestions.tsx`**: Uncomment the "Study in Chat" button.
6. **`context/SidebarContext.tsx`**: (Optional) Check the deletion redirect logic if a student deletes their last chat.
7. **`app/chat/layout.tsx`**: Remove the `role === 'student'` check that renders `UnauthorizedError`.
8. --> stats component for student comment and search icon in sidebar 