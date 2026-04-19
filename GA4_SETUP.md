# Google Analytics 4 Integration Setup

Your OttoAi dashboard now displays real Google Analytics data. Follow these steps to activate it.

## 1. Convert the JSON key to single-line format

You downloaded a JSON file from Google Cloud. Convert it to a single-line string:

1. Open the downloaded JSON in a text editor.
2. Replace all newlines with `\n` (literal backslash-n).
3. Example conversion:
   ```
   Original:
   {
     "type": "service_account",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     ...
   }

   Single-line:
   {"type":"service_account","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}
   ```

Or use this command to do it automatically:
```bash
cat /path/to/your/json | jq -c . | tr -d '\n'
```

## 2. Add environment variables

Copy the `GA4_SERVICE_ACCOUNT_KEY` string you created and add these to your `.env.local` file:

```
NEXT_PUBLIC_GA4_PROPERTY_ID=533668749
GA4_SERVICE_ACCOUNT_KEY={"type":"service_account",...entire key as single line...}
```

**Important:**
- `NEXT_PUBLIC_GA4_PROPERTY_ID` is your GA4 Property ID: `533668749`
- `GA4_SERVICE_ACCOUNT_KEY` must be the entire JSON as a single line with escaped newlines
- Keep this file secure and never commit it to version control
- .env.local is already in .gitignore

## 3. Restart your Next.js dev server

```bash
npm run dev
```

## 4. Verify GA4 is receiving data

1. Open Google Analytics for your OttoAi property.
2. Go to Real-time > Overview.
3. Open your app and navigate around.
4. You should see real-time events appearing.

## 5. Check the dashboard

Reload your OttoAi dashboard. The analytics charts should now show:
- Feature usage (top pages by event count)
- Daily active users (7-day trend)
- Browser distribution
- OS distribution  
- Device split (desktop/mobile/tablet)

## Troubleshooting

**"GA4 credentials not configured" error:**
- Verify `NEXT_PUBLIC_GA4_PROPERTY_ID` is in `.env.local`
- Verify `GA4_SERVICE_ACCOUNT_KEY` is in `.env.local`
- Check that the JSON key is properly escaped (all newlines replaced with `\n`)
- Restart the dev server after adding env vars

**No data appears:**
- Check that the service account email is added in GA4 Admin > Property access management with Viewer role
- Wait a few minutes for GA4 to collect initial data
- Check GA4 Real-time to confirm events are being tracked

**"Invalid GA4 service account key" error:**
- The JSON key is not properly formatted as a single line
- Ensure all newlines in the private_key are replaced with literal `\n`
- Use `jq -c .` to verify the JSON is valid

---

Once configured, the dashboard will automatically refresh analytics data from GA4.
