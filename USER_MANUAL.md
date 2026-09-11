# ROL's Fun Factory User Manual

## 1. About This Manual

ROL's Fun Factory is an education and activity management platform for student admissions, courses, attendance, homework, marks, fees, events, announcements, staff records, reports, and activity achievements.

The application displays only the modules assigned to the signed-in role. Direct access to an unauthorized module is also blocked.

## 2. Getting Started

### Sign in

1. Open the application and select **Staff Login**, or open `/login`.
2. Enter the **User ID** shown for your role below. You may enter the complete email address or, for accounts ending in `@rff.local`, the username portion only.
3. Enter the role password.
4. Select **Login**. The application opens the role dashboard.
5. Select **Logout** in the top-right corner when finished.

Sessions remain active for up to 10 hours. A failed login displays “Invalid username or password.”

## 3. Demo Accounts

The following accounts are created by the seed process. The demo password for every seeded account is `Welcome@123`.

| Role | User ID | Password | Demo user |
|---|---|---|---|
| Founder | `founder@rolfunfactory.com` | `Welcome@123` | Founder |
| Board Director | `board@rolfunfactory.com` | `Welcome@123` | Board Director |
| Admin Manager | `admin@rolfunfactory.com` | `Welcome@123` | Admin Manager |
| HR | `hr@rolfunfactory.com` | `Welcome@123` | HR Lead |
| Accounts | `accounts@rolfunfactory.com` | `Welcome@123` | Accounts Lead |
| Principal | `principal@rolfunfactory.com` | `Welcome@123` | Principal |
| Teacher | `teacher@rolfunfactory.com` | `Welcome@123` | Teacher Mira |
| Parent | `parent@rolfunfactory.com` | `Welcome@123` | Parent Ravi |
| Student | `student@rolfunfactory.com` | `Welcome@123` | Student Arul |

### Staff role account

| Role | User ID | Password |
|---|---|---|
| Staff | Not seeded by default | Create the account in **Settings** as Founder | 

After creating a Staff user, sign in with the new email or username and the password chosen during creation. Change all demo passwords before using the application with real data.

## 4. Public Enrollment

Anyone can open **New Enrollment Form** from the landing page without signing in.

1. Enter the student's name, class, discovery source, enquiry status, date of birth, age, city, state, course, residential address, and permanent address.
2. Enter the father's and mother's names, email addresses, and mobile numbers.
3. Enter the fee offered.
4. Select **Submit Enrollment**.

The enquiry is saved as an enrollment for authorized users to review. Use **Back to login** to return to the sign-in page.

## 5. Feature Guide

### Dashboard

The dashboard is the starting page after login. It shows a role-specific message, summary counts, and a **Module Access Snapshot**. Depending on the role, the summary may include students, staff, teachers, pending enrollments, and total fees logged.

### Students and Student List

- **Students / Add Student**: Founder and Admin Manager can create an active student record. Enter identity, class, enquiry, date of birth, age, location, addresses, parent contacts, offered fee, course, profile image, and the student's login username and password, then select **Save Student**.
- **Student List**: View active students and open their details. Founder and Admin Manager can select the edit action and use **Save Changes** to update a student.
- Parents see only their linked children. Students see only their own record. Other authorized operational roles see the active student list but cannot add or edit unless their role permits it.

### Staff and Staff List

- **Staff / Add Staff**: Founder and HR can create an employee profile and login. Enter name, profile image, account role, salary, username, password, and any available personal, contact, qualification, experience, and joining-date information. Select **Save Employee**.
- **Staff List**: Authorized users can view active staff and account-linked users. Founder and HR can edit a staff profile and select **Save Changes**.
- Salary values are used by the reports feature. Do not enter sensitive information unless it is required by the organization.

### Attendance

Authorized attendance users select a target type, search for a student or staff member, choose a date, select **Present**, **Absent**, or **Late**, optionally enter notes, and select **Save Attendance**.

- Founder, Admin Manager, HR, and Staff can record student and staff attendance as allowed by their screen.
- Teachers and Staff record student attendance.
- Parents can view student attendance records; students can view their own records.
- The table shows the most recent attendance entries first.

### Homework

Founder, Admin Manager, Principal, and Teacher can add homework. Enter subject, class, one or more students, homework date, submission date, description, and an optional attachment, then select **Submit**.

Use the student filter and **View** to narrow the list. Parents see homework for their linked children, and students see their own homework. Select **View File** to open an attachment when one exists.

### Newslet

All roles that have Newslet access can read published posts. Users other than Parents and Students can switch between **Add / Edit Post** and **View All Posts**.

To publish or update a post, enter the title, summary, details, and optional image, then select **Publish Post** or **Update Post**. Use **Edit** beside an existing post, **Cancel Edit** to leave edit mode, or **Reset** to clear the form.

### Fees

Founder and Accounts can record a payment. Select the student, enter the payee, amount, amount paid for, payment date, payment mode, status, notes, and optional invoice or snapshot, then select **Save Payment**.

Payment modes include Cash, UPI, Bank Transfer, Cheque, Card, and Other. Statuses include Pending, Partial, and Paid. All users with Fees access can select **View** to see receipt, payment, notes, dates, and an uploaded invoice. Parents and students use the fees page to view fee information available to their account.

### Reports

Founder, Board Director, HR, Accounts, and Principal can view reports. The page provides student, staff, attendance, revenue, and average-mark metrics; a revenue trend chart; and a Staff Salary Report.

Select **Export CSV** to download the staff salary report. The report also shows total monthly salary.

### Events & Camps

Founder, Admin Manager, and Principal can create an event. Enter the event name, date, and description, then select **Create Event**.

Users with Events access can view event dates, descriptions, and registration totals.

### Enrollment Workflow

Admin Manager and Founder can review public enrollment enquiries. Select **View** to inspect contact, address, parent, enquiry, age, and fee details. Set the status to **Pending**, **Approve**, or **Reject**, then select **Update**.

### Courses & Batches

Founder and Admin Manager can create a course and its first batch. Enter the course name, choose Montessori, Music, or Tuition, enter the batch name and timing, then select **Save**. The table lists each course, its type, and its batches.

### Notifications

Founder, Admin Manager, and Teacher can send an announcement. Select a target group, enter a title and message, then select **Send**. Target groups are Parents, Students, Teachers, and Admin.

Recipients view their notifications with title, message, status, sender/user, and date. Founder can view all notification records; other users see notifications addressed to their account.

### Marks & Performance

Founder, Teacher, Principal, and Staff can upload marks. Select a student, enter the subject, a mark from 0 to 100, and an optional exam type, then select **Save Mark**.

Parents see marks for their linked children. Students see their own marks. Other authorized roles see the marks available to their role.

### Activity Achievements

Teacher, Principal, and Founder can create and manage achievement tasks. To create one, enter a task title, optional description, stars from 1 to 10, select one or more students, and choose **Create & Assign Task**.

Use **Edit** to change a task, **Save Changes** to apply edits, or the delete action to remove it. The task table shows assigned, approved, and pending counts.

Students see assigned tasks and their status. When a student finishes a task, use the completion request action shown on the student view. The teacher, principal, or founder reviews pending requests and selects **Approve** or **Reject**. Approved stars appear beside the student's name and in the achievement total.

### Settings

Settings is available only to Founder. Use **Add User** to create an account by entering name, email, password, and role, then select **Create User**. The **User Access Control** table lists accounts and provides **Remove** for deleting an account.

## 6. Role Quick Reference

The following list is the complete feature access for each role. A feature marked “view” means the role can use the page but does not have the page's create or manage action.

### Founder

**User ID:** `founder@rolfunfactory.com`  
**Password:** `Welcome@123`

Founder has full access to Dashboard, Students, Student List, Staff, Staff List, Attendance, Homework, Newslet, Fees, Reports, Events & Camps, Enrollment Workflow, Courses & Batches, Notifications, Marks, Activity Achievements, and Settings.

Founder can add and edit students, add and edit staff, record attendance, create homework, publish and edit news, record fees, create events, approve or reject enrollments, create courses and batches, send announcements, upload marks, create/review achievement tasks, manage users, and export salary reports.

### Board Director

**User ID:** `board@rolfunfactory.com`  
**Password:** `Welcome@123`

Board Director can use Dashboard, Newslet, and Reports. Read published news, review dashboard indicators, view analytics and salary information, and export the salary CSV. This role has no create or edit controls for operational records.

### Admin Manager

**User ID:** `admin@rolfunfactory.com`  
**Password:** `Welcome@123`

Admin Manager can use Dashboard, Students, Student List, Attendance, Homework, Newslet, Events & Camps, Enrollment Workflow, Courses & Batches, and Notifications.

Use these features to add and edit students, view student lists, record attendance, create homework, publish or edit news, create events, approve or reject enrollments, create courses and batches, and send announcements. Admin Manager cannot record fees, upload marks, manage staff profiles, or open Settings.

### HR

**User ID:** `hr@rolfunfactory.com`  
**Password:** `Welcome@123`

HR can use Dashboard, Staff, Staff List, Attendance, Newslet, and Reports.

Add and edit staff records, review staff lists, record attendance, read and manage news, review operational metrics, and export the staff salary CSV. HR cannot create users in Settings.

### Accounts

**User ID:** `accounts@rolfunfactory.com`  
**Password:** `Welcome@123`

Accounts can use Dashboard, Fees, Newslet, Reports, Staff, and Staff List.

Record and inspect payments, view staff records, read or manage news, review revenue and salary reports, and export the staff salary CSV. Accounts cannot create or edit staff profiles from the Staff page.

### Principal

**User ID:** `principal@rolfunfactory.com`  
**Password:** `Welcome@123`

Principal can use Dashboard, Students, Student List, Attendance, Homework, Newslet, Marks, Reports, and Events & Camps.

View student records, record attendance, create homework, read or manage news, upload marks, review reports, and create events. Principal cannot add or edit student profiles, record fees, or manage users.

### Teacher

**User ID:** `teacher@rolfunfactory.com`  
**Password:** `Welcome@123`

Teacher can use Dashboard, Students, Student List, Attendance, Homework, Newslet, Marks, Events & Camps, Notifications, and Activity Achievements.

View students, record student attendance, create homework, read or manage news, upload marks, view events, send announcements, and create/review achievement tasks. Teacher cannot create events, record fees, or edit student profiles.

### Staff

**User ID:** Create in Settings as Founder  
**Password:** Set during account creation

Staff can use Dashboard, Attendance, Newslet, Events & Camps, Notifications, and Marks.

View the dashboard, record student attendance, read news, view events, view notifications, and upload marks. Staff cannot create announcements, create events, record fees, or manage student and staff profiles.

### Parent

**User ID:** `parent@rolfunfactory.com`  
**Password:** `Welcome@123`

Parent can use Dashboard, Students, Student List, Attendance, Newslet, Marks, Fees, Events & Camps, and Notifications.

Use the portal to view linked child records, attendance, marks, fees, news, events, and notifications. Parent records are filtered to the linked child or children where the feature supports relationship filtering. Parent has no create or edit controls.

### Student

**User ID:** `student@rolfunfactory.com`  
**Password:** `Welcome@123`

Student can use Dashboard, Attendance, Homework, Newslet, Marks, Events & Camps, Notifications, and Activity Achievements.

View personal attendance, homework, marks, news, events, and notifications. Use Activity Achievements to view assigned tasks, request completion, and monitor approved stars. The student's current star total appears beside the profile name. Student has no create or edit controls.

## 7. Operating Guidelines

- Use the role account that matches the work being performed. Do not share personal passwords.
- Verify student and parent details before saving records.
- Use the appropriate payment status and payment mode so reports remain accurate.
- Keep attachments small and relevant. Profile images must be valid image files and are limited by the application.
- Log out after using a shared computer.
- Replace the seeded demo passwords before production use.
