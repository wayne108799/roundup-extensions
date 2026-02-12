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
   - **Online Store (All Plans)**: Go to Shopify Admin > Online Store > Themes > Customize.
     Navigate to the Cart page, click "Add block", and select "RoundUp Donation".
     Enter your app URL in the block settings: https://e254dec1-aed7-41f8-b39f-66e817c86197-00-gylebt30kx15.picard.replit.dev
   - **Online Checkout (Plus only)**: Go to Shopify Admin > Settings > Checkout > Customize,
     then add the "RoundUp Donation" block to your checkout layout.
   - **POS**: Go to Shopify Admin > Point of Sale > Settings,
     then add the "RoundUp POS Donation" tile to your layout.

## What's Included

- `extensions/theme-app-extension/` - Theme donation widget (works on ALL Shopify plans)
- `extensions/checkout-ui/` - Checkout donation widget (Shopify Plus only)
- `extensions/pos-ui/` - POS terminal donation prompt
- `shopify.app.toml` - App configuration (pre-filled with your app URL)

## App URL

Extensions connect to: https://e254dec1-aed7-41f8-b39f-66e817c86197-00-gylebt30kx15.picard.replit.dev

## Syncing Updates

This repo is automatically updated when you push changes from your RoundUp admin dashboard.
On your Windows machine, just run `git pull` to get the latest extension code.
