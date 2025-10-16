// Initilize needed variables for getting followers
let ACCESS_TOKEN = '';
let REFRESH_TOKEN = '';
let CLIENT_ID = '';
let CLIENT_SECRET = '';
let USER_ID = '';
let token_expires_in = -1;

// Follow alert resources
const FOLLOW_GIF = document.getElementById('follow-gif');
const FOLLOW_TEXT = document.getElementById('follow-text');
const FOLLOW_MSG = 'SOMEONE followed!';
const FOLLOW_SOUND = document.getElementById('follow-sound');
FOLLOW_SOUND.volume = 0.5; //5 50% volume

const POLL_INTERVAL = 2000; // Checks followers every 2 seconds
const GIF_SHOW_DURATION = 5000; // Gif lasts 5 seconds on screen
let is_refreshing = false; // for pausing check followers while refresh is happening

let current_date = new Date().toISOString(); // current date in "20250-09-25T22:22:08Z" format

let known_follower_ids = new Set(); // Set of seen followers ids
let fake_followers_ids = new Set(); // Set for debug fake followers

const debug_followers = false; // set to 'true' to see follower debug
let debug_div = document.getElementById('debug-last-follower');


async function get_followers() {
	// Gets followers from the api
	// default is a list of 20 newest followers. Can be increased.
	// to get the max (100) in one page add '&first=100' to end of URL
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

function show_follow_gif(follower_name) {
	// Displayes the gif and text for time set in GIF_SHOW_DURATION
	// Plays sound just once
	return new Promise((resolve) => {
		// Made into a promise for async
		FOLLOW_GIF.style.display = 'block';

		FOLLOW_TEXT.textContent = follower_name;
		FOLLOW_TEXT.style.display = 'block';

		FOLLOW_SOUND.currentTime = 0;
		FOLLOW_SOUND.play();

		setTimeout(() => {
			FOLLOW_GIF.style.display = 'none';
			FOLLOW_TEXT.style.display = 'none';
			resolve();
		}, GIF_SHOW_DURATION);
	});
}

const follow_alert_queue = (() => {
	// Immediatly invoked function epression
	// Adds new followers to the queue
	// plays the follower alert for every user in queue
	// (I really like this)
	let queue = [];
	let is_playing = false;

	async function play_alert() {
		if (is_playing || queue.length === 0) return;

		is_playing = true;
		const follower = queue.shift();
		
		await show_follow_gif(follower);

		is_playing = false;
		play_alert();
	}

	return {
		add(follower) {
			queue.push(follower);
			play_alert();
		}
	};
})();

async function check_new_follow() {
	if (is_refreshing) {
		return;
	}

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

			// Insert fake follwers into the followers list for checking alert
			followers.unshift(...fake_followers_ids);
			fake_followers_ids.clear();
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

				follow_alert_queue.add(follower.user_name);

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

function random_number(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function add_follower() {
	// Adds a fake follower to fake followers set
	let fake_current_date = new Date().toISOString();
	// this random number is pointless i could have just done date
	// but i learned something
	let fake_id = random_number((10 * 1000), 100 * 1000) + Date.now();
	let fake_user_name = 'FAKE USER ' + random_number(0, 1000) + Date.now();

	new_fake_follower = {
		'user_id': fake_id,
		'user_name': fake_user_name,
		'followed_at': fake_current_date
	};
	fake_followers_ids.add(new_fake_follower);
}

function remove_follower() {
	const first_item = known_follower_ids.values().next().value;
	known_follower_ids.delete(first_item);
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

		const stored_access_token = get_local_storage('access_token');
		const stored_refresh_token = get_local_storage('refresh_token');

		ACCESS_TOKEN = (stored_access_token !== null) ? stored_access_token : config.access_token;
		REFRESH_TOKEN = (stored_refresh_token !== null) ? stored_refresh_token : config.refresh_token;

		CLIENT_ID = config.client_id;
		CLIENT_SECRET = config.client_secret;
		USER_ID = config.user_id;
	} catch (e) {
		console.error('Error parsing config:', e);
	}
}

function blackout_screen(blackscreen, error) {
	// makes the screen either black or transparent(OBS)/white(Browsers)
	if (error) {
		document.getElementById('blackout-screen').style.display = 'flex';
		document.getElementById('blackout-text').textContent = 'Error validating token';
	}

	if (blackscreen) {
		document.getElementById('blackout-screen').style.display = 'flex';
		document.getElementById('blackout-text').textContent = 'Token is INVALID';
	} else {
		document.getElementById('blackout-screen').style.display = 'none';
	}
}

function set_local_storage(data) {
	try {
		for (const key in data) {
			localStorage.setItem(key, data[key]);
		}
	} catch (e) {
		console.error('Failed to SET localStorage:', e);
	}
}

function get_local_storage(key) {
	try {
		return localStorage.getItem(key);
	} catch (e) {
		console.error('Failed to GET localStorage:', e);
		return null;
	}
}

async function get_new_tokens() {
	// Sends a request to twitch for new access and refresh token
	const body_params = new URLSearchParams();
	body_params.append('client_id', CLIENT_ID);
	body_params.append('client_secret', CLIENT_SECRET);
	body_params.append('grant_type', 'refresh_token');

	const stored_refresh_token = get_local_storage('refresh_token');

	if (stored_refresh_token === null) {
		body_params.append('refresh_token', REFRESH_TOKEN);
	} else {
		body_params.append('refresh_token', stored_refresh_token);
	}

	try {
		const response = await fetch('https://id.twitch.tv/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body_params.toString()
		});

		const data = await response.json();

		if (response.ok) {
			ACCESS_TOKEN = data.access_token;
			REFRESH_TOKEN = data.refresh_token;

			set_local_storage({
				access_token: data.access_token,
				refresh_token: data.refresh_token
			})
		} else {
			console.error('Refresh Token failed!!:', data);
		}
	} catch (e) {
		console.error('Refresh Token request failed!:', e)
	}
}

async function validate_access_token() {
	// Returns if the access token is valid or not
	// When invalid, displays that is INVALID on screen
	const URL = 'https://id.twitch.tv/oauth2/validate';
	const headers = {
		'Authorization': `Bearer ${ACCESS_TOKEN}`
	};

	try {
		const response = await fetch(URL, {method: 'GET', headers: headers});

		if (!response.ok) {
			console.log('Token is INVALID')
			blackout_screen(true, false)
			return false
		}

		const data = await response.json();
		console.log(`Token is valid! ${data.expires_in}`);
		token_expires_in = data.expires_in;
		blackout_screen(false, false)
		return true
	} catch (e) {
		console.error('Error validating token', e);
		blackout_screen(true, true)
		return false
	}
}

async function schedule_token_refresh(expires_in) {
	// uses setTimout to schedule token refresh a min before it expires
	const refresh_time = (expires_in - 60) * 1000;

	setTimeout(async () => {
		is_refreshing = true;

		await get_new_tokens();

		const valid = await validate_access_token();
		if (valid) {
			schedule_token_refresh(token_expires_in);
		}

		is_refreshing = false;
	}, refresh_time);
}

function delay(ms) {
	// Delay function...
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function init() {
	// Gets 20 most recent followers and populates Set
	try {
		const followers = await get_followers();
		followers.forEach(f => known_follower_ids.add(f.user_id));

		if (debug_followers) {
			console.log(known_follower_ids);
			document.getElementById('follower-buttons').style.display = 'block';
		}
	} catch (e) {
		console.error('Error loading inital followers:', e);
	}
}

async function start() {
	load_config(); // Loads the needed variables for twitch api

	// Keeps checking if access token is valid on 3 second loop
	let valid_access_token = false;
	while (!valid_access_token){
		valid_access_token = await validate_access_token();
		if (!valid_access_token) {
			await get_new_tokens();
			await delay(3000);
		}
	}
	
	// setup token refresh check
	schedule_token_refresh(token_expires_in);

	// runs setup then starts the 2 second interval
	// for checking for new followers
	await init();
	setInterval(check_new_follow, POLL_INTERVAL);
}

start();