# Local Twitch Follow Alert

A locally run Twitch follow alert system for OBS, built using vanilla HTML, JavaScript, and Python.

## Overview

This project allows you to display custom alerts in OBS and your browser whenever someone follows your Twitch channel. Unlike many online solutions, this runs entirely on your computer, giving you full control and privacy.

## Features

- **Local execution:** No third-party servers; everything runs on your machine.
- **Customizable:** Easy to modify alert visuals and sounds.
- **Simple setup:** Minimal dependencies and configuration.

## Requirements

- Python (recommended: 3.7+)
- Twitch account
- Modern web browser

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jonBeach/local-twitch-follow-alert.git
   cd local-twitch-follow-alert
   ```

2. **Get a Twitch Client ID:**
   - Find a Twitch application Client ID online somewhere.
   Or
   - Go to [Twitch Developer Console](https://dev.twitch.tv/).
   - Log in and create a new application.
   - Copy the Client ID.

3. **Create and Populate .env File:**
   - Create a `.env` file and add variables as shown in `.env.example`.
   - Or rename `.env.example` to `.env`.
   - Add your Twitch developer app's Client ID to `CLIENT_ID` (inside the `' '`).
   - Use `'http://localhost'` in `REDIRECT_URI` for easiest setup.

4. **Run the Python OAuth Script:**
   ```bash
   python twitch_oauth.py
   ```

5. **Authorize Twitch Connection:**
   - Authorize the connection to your Twitch account when the browser opens.
   - After being redirected to a blank localhost page, copy the URL in your browser.
   - Paste the URL into the `twitch_oauth.py` program when prompted.

6. **Add the Alert Page to OBS:**
   - Open OBS Studio.
   - Add a new "Browser" source.
   - Set the browser source to `file:///path-to-index.html`.

## Alternative Installation (No Python)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jonBeach/local-twitch-follow-alert.git
   cd local-twitch-follow-alert
   ```

2. **Get a Twitch Client ID:**
   - Find a Twitch application Client ID online somewhere.
   Or
   - Go to [Twitch Developer Console](https://dev.twitch.tv/).
   - Log in and create a new app.
   - Copy the Client ID.

3. **Get a User Token:**
   - Replace `client_id` in the URL below with your Client ID.
   - Change the scope to `moderator:read:followers`.
   - Paste the URL into your browser and authorize the connection.
   - You will be redirected to a blank localhost page.
   - Copy the token `access_token=your-token-here` from the URL.
   - Example URL:
     ```
     https://id.twitch.tv/oauth2/authorize?client_id=abc123&redirect_uri=http://localhost&response_type=token&scope=moderator:read:followers
     ```

4. **Get Your Channel User ID:**
   - Find your channel User ID.
   - Use [StreamWeasels ID Converter](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) or search Google.

5. **Input Values into `check_for_followers.js`:**
   - Open `check_for_followers.js`.
   - Populate the variables:
     ```javascript
     let ACCESS_TOKEN = 'your-user-token-here';
     let CLIENT_ID = 'your-client-id-here';
     let USER_ID = 'your-channel-id-here';
     ```

6. **Create HTML File:**
   - Rename the default HTML file to include `.html` at the end.
   - You can use any name, as long as it has the `.html` extension.

7. **Add the Alert Page to OBS:**
   - Open OBS Studio.
   - Add a new "Browser" source.
   - Set the browser source to `file:///path-to-index.html`.

## Usage

- When the backend detects a new follower, it triggers a visual/audio alert in OBS.
- Customize the HTML/CSS/JavaScript files for your own themes or sounds.

## Customization

- Edit the HTML/JavaScript files to change the appearance of alerts.
- Change sound files or animations by replacing assets in the project folder.

## Troubleshooting

- Make sure Python is installed (if using the Python version).
- Ensure OBS can access the HTML file.
- Check `index.html` and your environment variables for proper credentials.

## Author

- [jonBeach](https://github.com/jonBeach)

---

*For questions or contributions, open an issue or pull request on GitHub.*