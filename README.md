# RoundUp for Charity - Shopify Extensions

## Quick Setup

1. Make sure you have Node.js 18+ installed.

2. Clone this repo and install dependencies:
   ```
   git clone https://github.com/wayne108799/roundup-extensions.git
   cd roundup-extensions
   npm install
   ```

3. Deploy the extensions to your Shopify store:
   ```
   npm run deploy
   ```
   This will ask you to log in to your Shopify Partner account.

4. After deploying:
   - **Online Checkout**: Go to Shopify Admin > Settings > Checkout > Customize,
     then add the "RoundUp Donation" block to your checkout layout.
   - **POS**: Go to Shopify Admin > Point of Sale > Settings,
     then add the "RoundUp POS Donation" tile to your layout.

## What's Included

- `extensions/checkout-ui/` - Online checkout donation widget
- `extensions/pos-ui/` - POS terminal donation prompt
- `shopify.app.toml` - App configuration (pre-filled with your app URL)

## App URL

Extensions connect to: https://6140c2be-f843-4d5d-a409-49581b075d8d-00-1yn93pk7zmmz0.picard.replit.dev

## Syncing Updates

This repo is automatically updated when you push changes from your RoundUp admin dashboard.
On your Windows machine, just run `git pull` to get the latest extension code.
