# Email Configuration Guide

## Overview
The application uses **Nodemailer** to send welcome emails to newly created users with their login credentials. To enable email functionality, you need to configure SMTP settings in your `.env` file.

## Why Emails Aren't Being Sent

Without proper SMTP configuration, the email service will:
1. Log a warning: "⚠️  Email service configuration issue"
2. Still allow user creation to succeed (non-blocking)
3. Users will be created but won't receive welcome emails

## Configuration Steps

### 1. Create/Update `.env` file in the `backend/` directory

Add the following SMTP environment variables:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@restaurant.com
APP_URL=http://localhost:3000
```

### 2. Configuration for Gmail

**Best Approach: Use App Passwords**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Create an **App Password** for "Mail":
   - Click **App passwords**
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
4. Use this 16-character password as `SMTP_PASS` in your `.env` file

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=your-email@gmail.com
APP_URL=http://localhost:3000
```

### 3. Alternative Email Providers

#### **Gmail (Standard)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### **Outlook/Hotmail**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### **SendGrid**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
```

#### **Mailgun**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-api-key
```

## Verification

After configuring SMTP settings:

1. Restart the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Check the console output for:
   - ✅ "Email service ready - credentials verified" (success)
   - ⚠️  "Email service configuration issue" (failed)

3. Create a new user and verify:
   - User account is created successfully
   - Welcome email is received at the specified email address
   - Email contains login credentials and instructions

## Complete Backend `.env` Example

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/restaurant_management

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-from-google
EMAIL_FROM=your-email@gmail.com

# Application URL
APP_URL=http://localhost:3000
```

## Troubleshooting

### Issue: "Error: 535-5.7.8 Username and Password not accepted"
**Solution:** 
- For Gmail: Make sure you're using an App Password, not your regular password
- Check that 2-Step Verification is enabled
- Verify the app password is correct (16 characters with spaces)

### Issue: "ECONNREFUSED - Connection refused"
**Solution:**
- Check SMTP_HOST and SMTP_PORT are correct
- Make sure your firewall allows outgoing SMTP connections (usually port 587)
- Verify internet connectivity

### Issue: "Invalid email address"
**Solution:**
- Ensure EMAIL_FROM is a valid email address
- It should match or be authorized by your SMTP provider

### Issue: "Error: Certificate problem"
**Solution:**
- This is rare but can happen with self-signed certificates
- The application is configured to accept this (secure: false for development)

## Email Template Features

When a user is created, they receive an email containing:
- ✅ Welcome message
- ✅ Username and email
- ✅ Temporary password
- ✅ User role
- ✅ Security warning to change password
- ✅ Login instructions
- ✅ Link to the login page
- ✅ Support contact information

## Security Notes

⚠️ **Important:**
1. Never commit `.env` files to version control
2. Add `.env` to your `.gitignore` file
3. Always use App Passwords instead of your actual password for Gmail
4. Rotate sensitive credentials regularly
5. Use environment variables for production deployments
6. Consider using a dedicated email service provider for production

## Next Steps

1. Set up the `.env` file with your SMTP credentials
2. Restart the backend server
3. Test by creating a new user
4. Verify the welcome email arrives
5. Ensure users can log in with their credentials
