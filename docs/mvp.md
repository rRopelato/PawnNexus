# PawnNexus MVP

## Required

- Authentication with JWT
- Email and password registration/login
- Pawn CRUD
- R2 image uploads through authorized Worker endpoints
- Admin moderation for pending pawns
- Public browsing of approved pawns
- Search and basic filters
- Responsive dark theme UI

## Deferred

- Comments
- Ratings
- Followers
- Notifications
- Messaging
- Ranking
- Achievements
- Steam integration
- OCR
- Analytics

## Moderation Rule

Every new pawn starts with `status = pending`. Public endpoints must only expose approved pawns unless the requester owns the pawn or is an admin.
