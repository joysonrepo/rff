# Firebase Firestore Setup for ROL's Fun Factory

## 1. Create Firebase project
1. Go to Firebase Console.
2. Click Add project and create one.
3. In Project settings, copy the Project ID.

## 2. Enable Firestore Database
1. Open Build > Firestore Database.
2. Click Create database.
3. Start in production mode.
4. Choose the region nearest your users.

## 3. Create service account key
1. Open Project settings > Service accounts.
2. Click Generate new private key.
3. Download the JSON file.
4. Copy these values from JSON:
   - project_id
   - client_email
   - private_key

## 4. Configure environment variables
Set these in your local .env and deployment platform:
- AUTH_SECRET
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

Important: FIREBASE_PRIVATE_KEY must preserve line breaks. If using one line, use escaped \n.

## 5. Seed documents in Firestore
Run:

npm run db:seed

This creates collections and initial documents:
- users
- parents
- teachers
- students
- staff
- courses
- batches
- enrollments
- attendance
- marks
- fees
- events
- meta/counters

## 6. Firestore document model
Each collection uses numeric id fields inside each document.
Document key is also the same id as a string.

Example users document:
- collection: users
- document id: 1
- fields:
  - id: 1
  - name: Founder
  - email: founder@rolfunfactory.com
  - password: hashed string
  - role: FOUNDER
  - createdAt: ISO datetime string
  - updatedAt: ISO datetime string

## 7. Deploy environment setup
In hosting (Vercel/Render/etc.), add the same env vars:
- AUTH_SECRET
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

No SQL migration step is required for Firestore.
