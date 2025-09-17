The quick and dirty overview: I haven't touched a line of code since asp.net and do not have time to get back up to speed. A series of plugins created by IAmParadox27 particularly the media bar, https://github.com/IAmParadox27/jellyfin-plugin-media-bar, coupled with the current implementation of playlist creation in Jellyfin inspired some action. If you are running a Jellyfin server and have not seen Paraxox's collection of plugins, check them out. They are probably the biggest UI upgrade available right now. This utility makes it easy to quickly crank out tailored playlists for the Media Bar or general consumption. Think holidays or "Science Fiction September" for example. This was written by qwen3-coder-30b-a3b-instruct Q4 running in LM Studio on an RTX 5060TI 16GB & 3060 12GB 40K context and VS Code with Kilo Code. 

Even being quite out of the loop, I can see the code is less than optimal to be extremely polite. There are some regex genre filters that were not removed once Books were dropped from the scope which can probably be commented out without breaking the page among quite a few other issues. All that said, the generator works. And seems to work pretty well for what it does. It was like herding cats to get him (qwen & kilo) to write some of the functionality. This was just a project for personal use that turned out... acceptable. It is provided as-is and I do not forsee doing any updates beyond some minor polishing and possibly tackling music playlists. I'm getting some use out of it and thought someone else might be able to also.

This application allows you to create custom playlists from your Jellyfin media library with fairly robust filtering options. It is stand-alone, runs in a browser and does not require any server architecture for maximum compatability and simplicity.

<h6>Getting Started</h6>
                        <ol>
                            <li><strong>Enter Server Details:</strong> Input your Jellyfin server URL and API key in the appropriate fields.<br>
                                - To get an api key from your Jellyfin server log in as an admin, go to the dashboard then API Keys. Click + to add a key and name it whatever you want. Playlist Generator is logical but anything will work. Paste your server URL and API key in the appropriate fields. Clicking outside the API Key field "submits" the values and initiates Users, Genres and Studios fetches.</li>
                            <li><strong>Select User:</strong> This is the user you are creating the playlist for.</li>
                            <li><strong>Select Media Types:</strong> Choose which types of media you want to include (Movies, TV Series, Audio).<br>- Ignore audio for now, this app only supports video currently.</li>
                            <li><strong>Apply Filters:</strong> Use genre, studio, year, or search term filters to narrow down your selection.<br>- Ctrl + click to select multiple genres.</li>
                            <li><strong>Fetch Items:</strong> Click "Fetch Items" to retrieve matching items from your Jellyfin server into the Working List.</li>
                            <li><strong>Browse & Select:</strong> Browse the fetched items and select those you want in your playlist.<br>- Check multiple titles and click delete for quicker removal. For boolean filtering (ex. titles that are action AND adventure AND whatever) select the desired genres then click "Conform To Selected Genres" button. Once you are satisfied with the current list, click "Add To Master List". Rinse and repeat to continue building the Master List.</li>
                            <li><strong>Review Master List:</strong> This is the list that the Jellyfin playlist will be created with.</li>
                            <li><strong>Create Playlist:</strong> Give your playlist a name, add a description, and click "Save Playlist" to create it on your Jellyfin server.</li>
                        </ol>
<h6>Features</h6>
                        <ul>
                            <li><strong>Item Details:</strong> Click on any item's image to see detailed information in the modal window.</li>
                            <li><strong>Filtering:</strong> Use dropdowns and input fields to filter items by genre, studio, year range, or search term.</li>
                            <li><strong>Conform to Genres:</strong> Filter your working list to only include items that contain ALL currently selected genres.</li>
                            <li><strong>Playlist Management:</strong> Create, view, and manage playlists directly from your Jellyfin server.</li>
                        </ul>
<h6>Tips</h6>
                        <ul>
                            <li>Start with broad filters and then narrow them down for better results.</li>
                            <li>Use the "Conform to Genres" feature to quickly filter items that match all selected genres.</li>
                            <li>The Master List automagically de-duplicates so you dont have to worry about manually searching the list for duplicate titles.</li>
                            <li>The sort order of your Master List is the order the titles will appear in the playlist.</li>
                            <li>Clear lists using the "Clear All Lists" button when you want to start over.</li>
                            <li>Fetch Items returns 1000 records. If this hammers your machine or is not enough the value can be changed in script.js here "queryParams.append('Limit', '1000'); <i>// Increased titles limit to 1000 items</i>"</li>
                            <li>To make the page "remember" server address and API key, replace the occurances of "http://192.168.1.10:8096" with your server then modify this line<br>"input type="password" class="form-control" id="apiKey" placeholder="Enter your Jellyfin API key">" to this<br>"input type="password" class="form-control" id="apiKey" placeholder="<b>your API key</b>" <b>value="your API key"</b>>" in index.html</li>
                        </ul>
                        <p><strong>Note:</strong> This application requires a valid Jellyfin server with API access enabled. Make sure your server URL and API key are correct before attempting to fetch items.</p>
3060
