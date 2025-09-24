let ACCESS_TOKEN = '';
let CLIENT_ID = '';
let USER_ID = '';

const FOLLOW_GIF = document.getElementById('follow-gif');
const FOLLOW_TEXT = document.getElementById('follow-text');
const FOLLOW_MSG = 'SOMEONE followed!'
const FOLLOW_SOUND = document.getElementById('follow-sound');
FOLLOW_SOUND.volume = 0.5; //5 50% volume

const POLL_INTERVAL = 2000; //2 seconds
const GIF_SHOW_DURATION = 5000; //5 seconds

let known_follower_ids = new Set();

const debug_followers = false;
let debug_div = document.getElementById('debug-last-follower');


async function get_followers() {
	const URL = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${USER_ID}`;

	const response = await fetch(URL, {
		headers: {
			'Authorization': `Bearer ${ACCESS_TOKEN}`,
			'Client-ID': CLIENT_ID
		}
	});

	const data = await response.json();
	return data.data
}

function show_follow_gif() {
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
	try {
		const followers = await get_followers();

		if (followers.length == 0) return;

		if (debug_followers) {
			if (followers.length > 0) {
				const last_follower = followers[0];
				debug_div.textContent = `Last follower: ${last_follower.user_name} (ID: ${last_follower.user_id})`;
			} else {
				debug_div.textContent = 'No followers found.';
			}
		}

		for (const follower of followers) {
			if (known_follower_ids.has(follower.user_id)){
				break;
			}
			if (!known_follower_ids.has(follower.user_id)) {
				// New Follower Found
				known_follower_ids.add(follower.user_id)
				show_follow_gif();

				//break is for if for each poll i only want to show
				//the gif only once.
				//without the break it should show the gif for
				//each new follower
				//break;
			}
		}

		if (known_follower_ids.size > 100) {
			known_follower_ids = new Set([...known_follower_ids].slice(-100));
		}

	} catch (e) {
		console.error('Error checking followers: ', e);
	}
}

function load_config() {
	const config_tag = document.getElementById('config');
	if (!config_tag) {
		console.error('Config tag not found');
		return;
	}
	try {
		const config = JSON.parse(config_tag.textContent);
		ACCESS_TOKEN = config.access_token;
		CLIENT_ID = config.client_id;
		USER_ID = config.user_id;
	} catch (e) {
		console.error('Error parsing config:', e);
	}
}

async function init() {
	load_config();

	try {
		const followers = await get_followers();
		followers.forEach(f => known_follower_ids.add(f.user_id));
		console.log(known_follower_ids)
	} catch (e) {
		console.error('Error loading inital followers:', e)
	}
}

async function start() {
	await init();
	setInterval(check_new_follow, POLL_INTERVAL);
}

start();