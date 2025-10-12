// Initilize needed variables for getting followers
let ACCESS_TOKEN = '';
let REFRESH_TOKEN = '';
let CLIENT_ID = '';
let USER_ID = '';

// Follow alert resources
const FOLLOW_GIF = document.getElementById('follow-gif');
const FOLLOW_TEXT = document.getElementById('follow-text');
const FOLLOW_MSG = 'SOMEONE followed!';
const FOLLOW_SOUND = document.getElementById('follow-sound');
FOLLOW_SOUND.volume = 0.5; //5 50% volume

const POLL_INTERVAL = 2000; // Checks followers every 2 seconds
const GIF_SHOW_DURATION = 5000; // Gif lasts 5 seconds on screen

let current_date = new Date().toISOString(); // current date in "20250-09-25T22:22:08Z" format

let known_follower_ids = new Set(); // Set of seen followers ids

const debug_followers = true; // set to 'true' to see follower debug
let debug_div = document.getElementById('debug-last-follower');


async function get_followers() {
	// Gets followers from the api
	// default is a list of 20 newest followers. Can be increased.
	const URL = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${USER_ID}`;

	const response = await fetch(URL, {
		headers: {
			'Authorization': `Bearer ${ACCESS_TOKEN}`,
			'Client-ID': CLIENT_ID
		}
	});

	const data = await response.json();
	return data.data;
}

function show_follow_gif() {
	// Displayes the gif and text for time set in GIF_SHOW_DURATION
	// Plays sound just once
	FOLLOW_GIF.style.display = 'block';

	FOLLOW_TEXT.textContent = FOLLOW_MSG;
	FOLLOW_TEXT.style.display = 'block';

	FOLLOW_SOUND.currentTime = 0;
	FOLLOW_SOUND.play();

	setTimeout(() => {
		FOLLOW_GIF.style.display = 'none';
		FOLLOW_TEXT.style.display = 'none';
	}, GIF_SHOW_DURATION);
}

async function check_new_follow() {
	// Gets new follower list then checks for new followers
	try {
		const followers = await get_followers();

		// If no followers do nothing
		if (followers.length === 0) return;

		// This is for debug to see most recent follower in the top left of the page
		if (debug_followers) {
			const last_follower = followers[0];
			debug_div.textContent = 
			`Last Follower: ${last_follower.user_name}
			ID: ${last_follower.user_id}
			Date Followed: ${last_follower.followed_at}`;
		}

		// Reads through all the followers in the new list
		for (const follower of followers) {
			if (follower.followed_at < current_date) {
				// Ignores any followers if their followed_at date
				// is before this script is ran
				break;
			}
			if (known_follower_ids.has(follower.user_id)) {
				// This is needed because if someone unfollows without this a
				// new follower would be detected because in the list of 20 followers
				// the last one in the list is "new" to the list so its counted as
				// a new follower.
				break;
			}
			if (!known_follower_ids.has(follower.user_id)) {
				// New Follower Found
				known_follower_ids.add(follower.user_id);
				show_follow_gif();

				//break is for if for each poll i only want to show
				//the gif only once.
				//without the break it should show the gif for
				//each new follower
				//break;
			}
		}

		// Change newest followers followed at time to current_date
		// so we can ignore any follower with an older followed_at date
		let newest_followed_at = followers[0].followed_at;
		if (current_date < newest_followed_at) {
			current_date = newest_followed_at;
		}

		// Trims the Set to 100 known followers limit. Can be changed.
		// Too high of a number could cause memory or performance issues
		if (known_follower_ids.size > 100) {
			known_follower_ids = new Set([...known_follower_ids].slice(-100));
		}

	} catch (e) {
		console.error('Error checking followers: ', e);
	}
}

function load_config() {
	// Loads the needed variables for twitch api
	// that were injected into the index.html file.
	// This is to avoid secruity issues with browsers
	// not letting you read a file locally.
	const config_tag = document.getElementById('config');
	if (!config_tag) {
		console.error('Config tag not found');
		return;
	}
	try {
		const config = JSON.parse(config_tag.textContent);
		ACCESS_TOKEN = config.access_token;
		REFRESH_TOKEN = config.refresh_token;
		CLIENT_ID = config.client_id;
		USER_ID = config.user_id;
	} catch (e) {
		console.error('Error parsing config:', e);
	}
}

async function init() {
	// Loads the needed variables for twitch api
	// Gets 20 most recent followers and populates Set
	load_config();

	try {
		const followers = await get_followers();
		followers.forEach(f => known_follower_ids.add(f.user_id));

		if (debug_followers) {
			console.log(known_follower_ids);
		}
	} catch (e) {
		console.error('Error loading inital followers:', e);
	}
}

async function start() {
	// runs setup then starts the 2 second interval
	// for checking for new followers
	await init();
	setInterval(check_new_follow, POLL_INTERVAL);
}

start();