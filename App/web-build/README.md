# 5KI Web Application

A web version of the 5KI Financial Services mobile app that can be accessed through any web browser.

## 🚀 Quick Deploy to Render

### Method 1: One-Click Deploy
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the following settings:
   - **Name**: `5ki-web-app`
   - **Branch**: `main` (or your deployment branch)
   - **Build Command**: `npm install`
   - **Publish Directory**: `./web-build` (if deploying from root) or `.` (if deploying from web-build folder)
5. Click "Create Static Site"

### Method 2: Manual Upload
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Static Site"
3. Choose "Connect Git" or upload the files manually
4. Set the publish directory to the `web-build` folder

## 📱 Features

- 📱 Mobile-responsive design
- 💰 Loan application interface
- 💳 Deposit services
- 💸 Payment processing
- 📊 Financial management tools
- 🔐 Secure authentication

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or use the Express server
node server.js
```

The app will be available at `http://localhost:3000`

## 🌐 Access Your Deployed App

Once deployed on Render, you'll get a URL like:
- `https://5ki-web-app.onrender.com`

You can access this URL from any web browser on your phone or computer.

## 🔗 API Integration

The web app is configured to work with your existing backend API. Make sure to update the API endpoints in your mobile app's configuration to point to your deployed backend.

## 📞 Support

- **Email**: info@fiveki.onrender.com
- **Website**: https://fiveki.onrender.com
- **Facebook**: https://www.facebook.com/5KiFS

## 📝 Next Steps

1. ✅ Deploy this web version to Render
2. 🔄 Update API endpoints to match your backend
3. 🎨 Customize the design and branding
4. 📱 Test on various devices and browsers
5. 🚀 Consider adding PWA features for better mobile experience

---

**Built with ❤️ by 5KI Team**