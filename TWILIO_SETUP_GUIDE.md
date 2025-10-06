# Twilio Configuration Guide for AI Companion App

## Overview
This guide provides comprehensive instructions for configuring Twilio to enable voice calling functionality in the AI Companion App for Elderly Care.

## Required Twilio Configuration

### 1. Environment Variables Setup
Add these environment variables to your Replit project:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. Twilio Console Configuration Steps

#### Step 1: Create Twilio Account
1. Sign up at https://www.twilio.com
2. Complete phone verification
3. Choose "Voice" as your primary use case

#### Step 2: Get Account Credentials
1. Go to Twilio Console Dashboard
2. Copy your Account SID and Auth Token
3. Add them to your Replit Secrets

#### Step 3: Purchase Phone Number
1. Go to Phone Numbers > Manage > Buy a number
2. Choose a voice-capable number
3. Purchase the number (requires account upgrade from trial)

#### Step 4: Configure Webhooks
**Critical: These webhook URLs must be configured in Twilio Console**

**IMMEDIATE ACTION REQUIRED FOR AI CALLS TO WORK:**

1. Go to Phone Numbers > Manage > Active numbers
2. Click on your purchased phone number (+18556964146)
3. In the **Voice** section, set:
   - **Webhook**: `https://8daeaca5-299a-4252-939c-d7e26ce2e0b6-00-2hbd2r4bgom5k.picard.replit.dev/api/twilio/voice`
   - **HTTP Method**: POST

4. In the **Status callbacks** section (optional), set:
   - **Webhook**: `https://8daeaca5-299a-4252-939c-d7e26ce2e0b6-00-2hbd2r4bgom5k.picard.replit.dev/api/twilio/status`
   - **HTTP Method**: POST

5. **Save Configuration**

**Without this webhook configuration, calls will say "Press any key to execute your code" instead of running the AI conversation.**

### 3. Trial Account Limitations

#### Phone Number Verification (Trial Accounts Only)
If using a Twilio trial account, you can only call verified numbers:

1. Go to Phone Numbers > Manage > Verified Caller IDs
2. Click "Add a new Caller ID"
3. Enter the phone number you want to call
4. Follow verification process (call or SMS)
5. Wait for verification completion

#### Trial Account Restrictions:
- Only verified numbers can be called
- Calls limited to 10 minutes
- Prepended message about trial account
- Limited to one phone number

#### Upgrading from Trial:
1. Go to Account > Billing
2. Add payment method
3. Upgrade to paid account
4. Can now call any valid phone number

### 4. Testing Configuration

#### Test Environment Variables:
```bash
# Check if variables are set correctly
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN  
echo $TWILIO_PHONE_NUMBER
```

#### Test API Connection:
Use the test call feature in Live Status page:
1. Navigate to Live Status
2. Click "Test Call" button  
3. Enter verified phone number (trial) or any number (paid)
4. Select a patient profile
5. Start test call

### 5. Webhook Requirements

Your Replit app must be publicly accessible for Twilio webhooks to work:
- Ensure your Replit is deployed and running
- Use the HTTPS domain provided by Replit
- Never use localhost URLs for webhook configuration

### 6. Common Issues & Solutions

#### Issue: "Number is unverified" Error
**Solution:** Verify the phone number in Twilio Console or upgrade to paid account

#### Issue: Webhooks not receiving calls
**Solution:** 
- Check webhook URLs in Twilio Console
- Ensure HTTPS (not HTTP) in webhook URLs
- Verify Replit app is running and publicly accessible

#### Issue: "Authentication failed" 
**Solution:**
- Double-check Account SID and Auth Token
- Ensure no extra spaces in environment variables
- Regenerate Auth Token if needed

#### Issue: No call logs in Twilio Console
**Solution:**
- Verify webhook URLs are correctly configured
- Check if your Replit app is responding to webhook requests
- Review server logs for webhook processing

### 7. Production Recommendations

1. **Upgrade to Paid Account:** Remove trial limitations
2. **Multiple Phone Numbers:** Consider different numbers for different regions
3. **Call Recording:** Enable call recording for quality assurance
4. **Error Handling:** Implement robust error handling for failed calls
5. **Rate Limiting:** Implement call rate limiting to prevent abuse
6. **Monitoring:** Set up monitoring for call success rates

### 8. Security Best Practices

1. **Environment Variables:** Never commit Twilio credentials to code
2. **Webhook Validation:** Validate webhook requests from Twilio
3. **Access Control:** Restrict who can initiate calls
4. **Audit Logging:** Log all call attempts and results

### 9. Cost Management

#### Trial Account:
- $15.50 free credit
- Voice calls: ~$0.0175/minute

#### Paid Account:
- Voice calls: ~$0.0175/minute
- Phone number rental: ~$1/month
- SMS: ~$0.0075/message

### 10. Support Resources

- Twilio Documentation: https://www.twilio.com/docs
- Twilio Support: https://support.twilio.com
- Status Page: https://status.twilio.com

## Quick Start Checklist

- [ ] Create Twilio account
- [ ] Copy Account SID and Auth Token to Replit Secrets
- [ ] Purchase phone number (or use trial number)
- [ ] Configure webhook URLs in Twilio Console
- [ ] Verify phone numbers (trial accounts)
- [ ] Test call functionality in Live Status page
- [ ] Monitor call logs in Twilio Console

## Integration Status

Once properly configured, the AI Companion App will:
1. Make automated calls to elderly users
2. Use OpenAI for intelligent conversation
3. Support ElevenLabs premium voices
4. Log all call interactions
5. Provide real-time call monitoring

For technical support with this integration, check the server logs and Twilio Console call logs for detailed error information.