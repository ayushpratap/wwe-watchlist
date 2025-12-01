import { app, auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, doc, onSnapshot, setDoc, getDoc } from "./firebase-config.js";

// --- GEMINI API (For AI Features) ---
let geminiApiKey = localStorage.getItem('wwe_gemini_key') || "";

// Function to get key or prompt user
function getGeminiKey() {
    if (geminiApiKey) return geminiApiKey;
    toggleKeyModal();
    return null;
}

window.saveApiKey = function() {
    const input = document.getElementById('api-key-input');
    if (input.value.trim()) {
        geminiApiKey = input.value.trim();
        localStorage.setItem('wwe_gemini_key', geminiApiKey);
        toggleKeyModal();
        updateApiKeyStatus();
        alert("API Key saved! You can now use AI features.");
    }
}

window.removeApiKey = function() {
    if (confirm("Are you sure you want to remove your API key? AI features will stop working.")) {
        geminiApiKey = "";
        localStorage.removeItem('wwe_gemini_key');
        toggleKeyModal();
        updateApiKeyStatus();
        alert("API Key removed.");
    }
}

window.toggleKeyModal = function() {
    document.getElementById('key-modal').classList.toggle('hidden');
}

// Update API key button status
function updateApiKeyStatus() {
    const statusText = document.getElementById('api-key-status');
    const keyBtn = document.getElementById('api-key-btn');
    if (geminiApiKey && geminiApiKey.length > 0) {
        statusText.innerText = 'API Key Set ✓';
        keyBtn.classList.remove('bg-yellow-900/50', 'border-yellow-500', 'text-yellow-200');
        keyBtn.classList.add('bg-green-900/50', 'border-green-500', 'text-green-200');
    } else {
        statusText.innerText = 'Set API Key';
        keyBtn.classList.remove('bg-green-900/50', 'border-green-500', 'text-green-200');
        keyBtn.classList.add('bg-yellow-900/50', 'border-yellow-500', 'text-yellow-200');
    }
}

// Call on page load
updateApiKeyStatus();

// -------------------------------------------------------------------------

// --- APP STATE ---
let isAuthModeLogin = true; // Toggle between Login/Signup
let watchedItems = [];
let currentUser = null;
let unsubscribeDoc = null;
let chatHistory = [];

        // --- DATA ---
        const scheduleData = [
            {
                month: "January 2025",
                subtitle: "The Netflix Era Begins",
                events: [
                    { id: "jan-3", date: "Jan 3", day: "Fri", show: "SmackDown", type: "smackdown", note: "Final build to Netflix era" },
                    { id: "jan-6", date: "Jan 6", day: "Mon", show: "RAW", type: "raw", note: "NETFLIX PREMIERE - The Rock Returns", highlight: true },
                    { id: "jan-10", date: "Jan 10", day: "Fri", show: "SmackDown", type: "smackdown", note: "The Bloodline Fallout" },
                    { id: "jan-13", date: "Jan 13", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jan-17", date: "Jan 17", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "jan-20", date: "Jan 20", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jan-24", date: "Jan 24", day: "Fri", show: "SmackDown", type: "smackdown", note: "Cody/Kevin Owens Escalation" },
                    { id: "jan-27", date: "Jan 27", day: "Mon", show: "Raw", type: "raw", note: "Go-Home Show" },
                    { id: "jan-31", date: "Jan 31", day: "Fri", show: "SmackDown", type: "smackdown", note: "Final Rumble Hype" }
                ]
            },
            {
                month: "February 2025",
                subtitle: "Road to WrestleMania",
                events: [
                    { id: "feb-1", date: "Feb 1", day: "Sat", show: "ROYAL RUMBLE 2025", type: "ple", note: "Indianapolis - Must Watch", highlight: true },
                    { id: "feb-3", date: "Feb 3", day: "Mon", show: "Raw", type: "raw", note: "Rumble Fallout" },
                    { id: "feb-7", date: "Feb 7", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "feb-10", date: "Feb 10", day: "Mon", show: "Raw", type: "raw" },
                    { id: "feb-14", date: "Feb 14", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "feb-17", date: "Feb 17", day: "Mon", show: "Raw", type: "raw" },
                    { id: "feb-21", date: "Feb 21", day: "Fri", show: "SmackDown", type: "smackdown", note: "Chamber Qualifiers" },
                    { id: "feb-24", date: "Feb 24", day: "Mon", show: "Raw", type: "raw" },
                    { id: "feb-28", date: "Feb 28", day: "Fri", show: "SmackDown", type: "smackdown", note: "Go-Home Show - The Rock's Ultimatum" }
                ]
            },
            {
                month: "March 2025",
                subtitle: "The Road Clears",
                events: [
                    { id: "mar-1", date: "Mar 1", day: "Sat", show: "ELIMINATION CHAMBER", type: "ple", note: "Toronto - Must Watch", highlight: true },
                    { id: "mar-3", date: "Mar 3", day: "Mon", show: "Raw", type: "raw", note: "Chamber Fallout" },
                    { id: "mar-7", date: "Mar 7", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "mar-10", date: "Mar 10", day: "Mon", show: "Raw", type: "raw" },
                    { id: "mar-14", date: "Mar 14", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "mar-17", date: "Mar 17", day: "Mon", show: "Raw", type: "raw", note: "Major WrestleMania Betrayal" },
                    { id: "mar-21", date: "Mar 21", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "mar-24", date: "Mar 24", day: "Mon", show: "Raw", type: "raw" },
                    { id: "mar-28", date: "Mar 28", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "mar-31", date: "Mar 31", day: "Mon", show: "Raw", type: "raw" }
                ]
            },
            {
                month: "April 2025",
                subtitle: "WrestleMania Season",
                events: [
                    { id: "apr-4", date: "Apr 4", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "apr-7", date: "Apr 7", day: "Mon", show: "Raw", type: "raw" },
                    { id: "apr-11", date: "Apr 11", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "apr-14", date: "Apr 14", day: "Mon", show: "Raw", type: "raw", note: "Final Raw" },
                    { id: "apr-18", date: "Apr 18", day: "Fri", show: "SmackDown", type: "smackdown", note: "Hall of Fame / Go-Home" },
                    { id: "apr-19", date: "Apr 19", day: "Sat", show: "WRESTLEMANIA 41 - N1", type: "ple", note: "Las Vegas", highlight: true },
                    { id: "apr-20", date: "Apr 20", day: "Sun", show: "WRESTLEMANIA 41 - N2", type: "ple", note: "Las Vegas", highlight: true },
                    { id: "apr-21", date: "Apr 21", day: "Mon", show: "Raw", type: "raw", note: "Raw After Mania" },
                    { id: "apr-25", date: "Apr 25", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "apr-28", date: "Apr 28", day: "Mon", show: "Raw", type: "raw", note: "Draft Begins" }
                ]
            },
            {
                month: "May 2025",
                subtitle: "Post-Mania Reset",
                events: [
                    { id: "may-2", date: "May 2", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "may-5", date: "May 5", day: "Mon", show: "Raw", type: "raw" },
                    { id: "may-9", date: "May 9", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "may-10", date: "May 10", day: "Sat", show: "BACKLASH 2025", type: "ple", note: "Premium Live Event", highlight: true },
                    { id: "may-12", date: "May 12", day: "Mon", show: "Raw", type: "raw" },
                    { id: "may-16", date: "May 16", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "may-19", date: "May 19", day: "Mon", show: "Raw", type: "raw" },
                    { id: "may-23", date: "May 23", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "may-24", date: "May 24", day: "Sat", show: "KING & QUEEN OF RING", type: "ple", note: "Saudi Arabia", highlight: true },
                    { id: "may-26", date: "May 26", day: "Mon", show: "Raw", type: "raw" },
                    { id: "may-30", date: "May 30", day: "Fri", show: "SmackDown", type: "smackdown" }
                ]
            },
            {
                month: "June 2025",
                subtitle: "Briefcase Season",
                events: [
                    { id: "jun-2", date: "Jun 2", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jun-6", date: "Jun 6", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "jun-7", date: "Jun 7", day: "Sat", show: "MONEY IN THE BANK", type: "ple", note: "Los Angeles", highlight: true },
                    { id: "jun-9", date: "Jun 9", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jun-13", date: "Jun 13", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "jun-16", date: "Jun 16", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jun-20", date: "Jun 20", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "jun-23", date: "Jun 23", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jun-27", date: "Jun 27", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "jun-28", date: "Jun 28", day: "Sat", show: "NIGHT OF CHAMPIONS", type: "ple", note: "Premium Live Event", highlight: true },
                    { id: "jun-30", date: "Jun 30", day: "Mon", show: "Raw", type: "raw" }
                ]
            },
            {
                month: "July 2025",
                subtitle: "The Summer Heats Up",
                events: [
                    { id: "jul-4", date: "Jul 4", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "jul-7", date: "Jul 7", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jul-11", date: "Jul 11", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "jul-14", date: "Jul 14", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jul-18", date: "Jul 18", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "jul-21", date: "Jul 21", day: "Mon", show: "Raw", type: "raw" },
                    { id: "jul-25", date: "Jul 25", day: "Fri", show: "SmackDown", type: "smackdown", note: "Roman Reigns Returns" },
                    { id: "jul-28", date: "Jul 28", day: "Mon", show: "Raw", type: "raw", note: "Final SummerSlam Build" }
                ]
            },
            {
                month: "August 2025",
                subtitle: "Biggest Party of the Summer",
                events: [
                    { id: "aug-1", date: "Aug 1", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "aug-2", date: "Aug 2", day: "Sat", show: "SUMMERSLAM - N1", type: "ple", note: "New Jersey", highlight: true },
                    { id: "aug-3", date: "Aug 3", day: "Sun", show: "SUMMERSLAM - N2", type: "ple", note: "New Jersey", highlight: true },
                    { id: "aug-4", date: "Aug 4", day: "Mon", show: "Raw", type: "raw", note: "SummerSlam Fallout" },
                    { id: "aug-8", date: "Aug 8", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "aug-11", date: "Aug 11", day: "Mon", show: "Raw", type: "raw" },
                    { id: "aug-15", date: "Aug 15", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "aug-18", date: "Aug 18", day: "Mon", show: "Raw", type: "raw" },
                    { id: "aug-22", date: "Aug 22", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "aug-25", date: "Aug 25", day: "Mon", show: "Raw", type: "raw" },
                    { id: "aug-29", date: "Aug 29", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "aug-31", date: "Aug 31", day: "Sun", show: "CLASH IN PARIS", type: "ple", note: "France", highlight: true }
                ]
            },
            {
                month: "September 2025",
                subtitle: "Fallout & New Rivals",
                events: [
                    { id: "sep-1", date: "Sep 1", day: "Mon", show: "Raw", type: "raw" },
                    { id: "sep-5", date: "Sep 5", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "sep-8", date: "Sep 8", day: "Mon", show: "Raw", type: "raw" },
                    { id: "sep-12", date: "Sep 12", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "sep-15", date: "Sep 15", day: "Mon", show: "Raw", type: "raw" },
                    { id: "sep-19", date: "Sep 19", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "sep-20", date: "Sep 20", day: "Sat", show: "WRESTLEPALOOZA", type: "ple", note: "Indianapolis", highlight: true },
                    { id: "sep-22", date: "Sep 22", day: "Mon", show: "Raw", type: "raw" },
                    { id: "sep-26", date: "Sep 26", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "sep-29", date: "Sep 29", day: "Mon", show: "Raw", type: "raw" }
                ]
            },
            {
                month: "October 2025",
                subtitle: "Crown Jewel Season",
                events: [
                    { id: "oct-3", date: "Oct 3", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "oct-4", date: "Oct 4", day: "Sat", show: "PAYBACK 2025", type: "ple", note: "Premium Live Event", highlight: true },
                    { id: "oct-6", date: "Oct 6", day: "Mon", show: "Raw", type: "raw" },
                    { id: "oct-10", date: "Oct 10", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "oct-11", date: "Oct 11", day: "Sat", show: "CROWN JEWEL", type: "ple", note: "Saudi Arabia", highlight: true },
                    { id: "oct-13", date: "Oct 13", day: "Mon", show: "Raw", type: "raw" },
                    { id: "oct-17", date: "Oct 17", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "oct-20", date: "Oct 20", day: "Mon", show: "Raw", type: "raw" },
                    { id: "oct-24", date: "Oct 24", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "oct-27", date: "Oct 27", day: "Mon", show: "Raw", type: "raw" },
                    { id: "oct-31", date: "Oct 31", day: "Fri", show: "SmackDown", type: "smackdown" }
                ]
            },
            {
                month: "November 2025",
                subtitle: "WarGames Season",
                events: [
                    { id: "nov-3", date: "Nov 3", day: "Mon", show: "Raw", type: "raw" },
                    { id: "nov-7", date: "Nov 7", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "nov-10", date: "Nov 10", day: "Mon", show: "Raw", type: "raw" },
                    { id: "nov-14", date: "Nov 14", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "nov-17", date: "Nov 17", day: "Mon", show: "Raw", type: "raw" },
                    { id: "nov-21", date: "Nov 21", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "nov-24", date: "Nov 24", day: "Mon", show: "Raw", type: "raw", note: "Final WarGames Build" },
                    { id: "nov-28", date: "Nov 28", day: "Fri", show: "SmackDown", type: "smackdown" },
                    { id: "nov-29", date: "Nov 29", day: "Sat", show: "SURVIVOR SERIES", type: "ple", note: "San Diego - WarGames", highlight: true }
                ]
            },
            {
                month: "December 2025",
                subtitle: "Current Day",
                events: [
                    { id: "dec-1", date: "Dec 1", day: "Mon", show: "Raw", type: "raw", note: "TODAY'S EPISODE" }
                ]
            }
        ];

        // --- DOM ELEMENTS ---
        const container = document.getElementById('app-container');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const syncStatus = document.getElementById('sync-status');
        const chatMessages = document.getElementById('chat-messages');
        const storyModal = document.getElementById('story-modal');
        const storyContent = document.getElementById('story-content');
        
        // Auth DOM
        const authModal = document.getElementById('auth-modal');
        const authTitle = document.getElementById('auth-title');
        const authSubmitBtn = document.getElementById('auth-submit-btn');
        const authSwitchText = document.getElementById('auth-switch-text');
        const authSwitchBtn = document.getElementById('auth-switch-btn');
        const authError = document.getElementById('auth-error');
        const loginBtn = document.getElementById('login-btn');
        const userInfo = document.getElementById('user-info');
        const userEmail = document.getElementById('user-email');
        const storageType = document.getElementById('storage-type');

        // --- AUTH LOGIC ---

        if (auth) {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    currentUser = user;
                    loginBtn.classList.add('hidden');
                    userInfo.classList.remove('hidden');
                    userEmail.innerText = user.email || 'User';
                    syncStatus.innerHTML = `<i class="fas fa-circle text-[8px] text-green-500"></i> Online`;
                    storageType.innerHTML = `Cloud Sync: ${user.email || 'Active'}`;
                    
                    // Show API key button when logged in
                    document.getElementById('api-key-btn').classList.remove('hidden');
                    
                    // Setup cloud listener for specific user data
                    setupUserListener(user.uid);
                } else {
                    currentUser = null;
                    loginBtn.classList.remove('hidden');
                    userInfo.classList.add('hidden');
                    syncStatus.innerHTML = `<i class="fas fa-circle text-[8px] text-gray-500"></i> Local`;
                    storageType.innerHTML = `Local Storage`;
                    
                    // Hide API key button when logged out
                    document.getElementById('api-key-btn').classList.add('hidden');
                    
                    // Fallback to local storage
                    watchedItems = JSON.parse(localStorage.getItem('wwe2025_progress')) || [];
                    renderApp();
                }
            });
        } else {
            watchedItems = JSON.parse(localStorage.getItem('wwe2025_progress')) || [];
            renderApp();
        }

        let unsubscribeChat = null;

        function setupUserListener(uid) {
            if (!db) return;
            if (unsubscribeDoc) unsubscribeDoc(); 
            if (unsubscribeChat) unsubscribeChat();

            // PATH: users/{uid}/wwe_data/progress
            const docRef = doc(db, 'users', uid, 'wwe_data', 'progress');
            
            syncStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin text-blue-500"></i> Syncing...`;

            unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    watchedItems = data.watched || [];
                } else {
                    // New user? Maybe save local items to cloud initially
                    if (watchedItems.length > 0) updateCloudStorage();
                }
                syncStatus.innerHTML = `<i class="fas fa-circle text-[8px] text-green-500"></i> Online`;
                renderApp();
            }, (error) => {
                console.error("Firestore error:", error);
                syncStatus.innerHTML = `<i class="fas fa-exclamation-triangle text-yellow-500"></i> Error`;
            });

            // PATH: users/{uid}/wwe_data/chat
            const chatRef = doc(db, 'users', uid, 'wwe_data', 'chat');
            unsubscribeChat = onSnapshot(chatRef, (docSnap) => {
                if (docSnap.exists()) {
                    chatHistory = docSnap.data().history || [];
                    // If chat modal is open, we might want to refresh it, but for now just syncing state
                }
            });
        }

        window.toggleAuthModal = function() {
            authModal.classList.toggle('hidden');
            authError.classList.add('hidden');
            // Reset form state
            document.getElementById('auth-form').reset();
        }

        window.switchAuthMode = function() {
            isAuthModeLogin = !isAuthModeLogin;
            if (isAuthModeLogin) {
                authTitle.innerText = "Login";
                authSubmitBtn.innerText = "Login";
                authSwitchText.innerText = "Don't have an account?";
                authSwitchBtn.innerText = "Sign Up";
            } else {
                authTitle.innerText = "Sign Up";
                authSubmitBtn.innerText = "Sign Up";
                authSwitchText.innerText = "Already have an account?";
                authSwitchBtn.innerText = "Login";
            }
            authError.classList.add('hidden');
        }

        window.handleAuth = async function(e) {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            
            authError.classList.add('hidden');
            authSubmitBtn.disabled = true;
            authSubmitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Processing...`;

            try {
                if (isAuthModeLogin) {
                    await signInWithEmailAndPassword(auth, email, password);
                } else {
                    await createUserWithEmailAndPassword(auth, email, password);
                }
                toggleAuthModal();
            } catch (error) {
                console.error(error);
                authError.innerText = error.message.replace('Firebase: ', '');
                authError.classList.remove('hidden');
            } finally {
                authSubmitBtn.disabled = false;
                authSubmitBtn.innerText = isAuthModeLogin ? "Login" : "Sign Up";
            }
        }

        window.logout = async function() {
            if(confirm("Are you sure you want to logout?")) {
                // Clear Gemini API key for security
                geminiApiKey = "";
                localStorage.removeItem('wwe_gemini_key');
                updateApiKeyStatus();
                
                // Clear local progress to prevent data leaking to guest mode
                localStorage.removeItem('wwe2025_progress');
                
                // Clear Chat History
                chatHistory = [];
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    chatMessages.innerHTML = `
                        <div class="flex items-start gap-2">
                            <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-robot text-xs text-white"></i>
                            </div>
                            <div class="bg-zinc-800 rounded-lg p-3 text-sm text-gray-200 max-w-[85%]">
                                I am the 2025 Wrestling Oracle! Ask me about the schedule or storylines!
                            </div>
                        </div>
                    `;
                }

                // Sign out from Firebase
                await signOut(auth);
            }
        }

        window.signInWithGoogle = async function() {
            const provider = new GoogleAuthProvider();
            authError.classList.add('hidden');
            
            try {
                await signInWithPopup(auth, provider);
                toggleAuthModal();
            } catch (error) {
                console.error("Google sign-in error:", error);
                authError.innerText = error.message.replace('Firebase: ', '');
                authError.classList.remove('hidden');
            }
        }

        // --- DATA FUNCTIONS ---

        async function updateCloudStorage() {
            // Backup to local ONLY if not logged in (guest mode)
            if (!currentUser) {
                localStorage.setItem('wwe2025_progress', JSON.stringify(watchedItems));
            }

            if (!currentUser || !db) return; 
            
            syncStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin text-blue-500"></i> Saving...`;
            
            try {
                const docRef = doc(db, 'users', currentUser.uid, 'wwe_data', 'progress');
                await setDoc(docRef, { watched: watchedItems, lastUpdated: new Date() }, { merge: true });
                
                syncStatus.innerHTML = `<i class="fas fa-check text-green-500"></i> Saved`;
                setTimeout(() => {
                    syncStatus.innerHTML = `<i class="fas fa-circle text-[8px] text-green-500"></i> Online`;
                }, 2000);
            } catch (e) {
                console.error("Save failed:", e);
                syncStatus.innerHTML = `<i class="fas fa-times text-red-500"></i> Save Failed`;
            }
        }

        window.toggleWatch = function(id) {
            if (watchedItems.includes(id)) {
                watchedItems = watchedItems.filter(item => item !== id);
            } else {
                watchedItems.push(id);
            }
            renderApp();
            updateCloudStorage();
        }

        window.copyAndWatch = function(searchQuery, clipboardText) {
            const tempInput = document.createElement("input");
            tempInput.value = clipboardText;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);

            const url = `https://www.netflix.com/search?q=${encodeURIComponent(searchQuery)}`;
            window.open(url, '_blank');
        }

        window.resetProgress = function() {
            if(confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
                watchedItems = [];
                renderApp();
                updateCloudStorage();
            }
        }

        // --- STORY SO FAR LOGIC ---
        window.toggleStoryModal = function() {
            storyModal.classList.toggle('hidden');
        }

        window.generateStorySoFar = async function() {
            let watchedContext = [];
            scheduleData.forEach(month => {
                month.events.forEach(event => {
                    if (watchedItems.includes(event.id)) {
                        watchedContext.push(`${event.date} (${event.show}): ${event.note || ''}`);
                    }
                });
            });

            if (watchedContext.length === 0) {
                alert("You haven't checked any shows yet! Watch some episodes first.");
                return;
            }

            storyContent.innerHTML = `
                <div class="flex flex-col items-center justify-center h-48 gap-4">
                    <i class="fas fa-circle-notch fa-spin text-4xl text-purple-500"></i>
                    <p class="text-sm text-purple-300 animate-pulse">Consulting the wrestling archives...</p>
                </div>
            `;
            toggleStoryModal();

            const prompt = `Based on these WWE events the user has watched in 2025, write a dramatic, 'Previously on WWE' style recap (approx 150 words). 
            Focus on the narrative flow and key storylines mentioned in the notes. Make it sound exciting like a TV intro.
            
            FORMATTING RULES:
            - Use **bold** for wrestler names and key events.
            - Use *italics* for emphasis.
            - Use bullet points for key plot beats.
            - Keep paragraphs short and punchy.
            
            User's Watch History:
            ${watchedContext.join('\n')}`;

            const summary = await window.callGemini(prompt);

            // Format the markdown response to HTML
            let formattedSummary = summary
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-400">$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em class="text-gray-400">$1</em>') // Italics
                .replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>') // Bullet points
                .replace(/\n/g, '<br>'); // Line breaks

            storyContent.innerHTML = `
                <div class="prose prose-invert prose-sm max-w-none">
                    <p class="text-lg text-purple-200 font-medium italic border-l-4 border-purple-500 pl-4 mb-4">
                        "Previously on WWE..."
                    </p>
                    <div class="leading-relaxed space-y-2">${formattedSummary}</div>
                </div>
            `;
        }

        // --- RENDER LOGIC ---

        function renderApp() {
            container.innerHTML = '';
            let totalItems = 0;

            scheduleData.forEach(monthBlock => {
                const section = document.createElement('section');
                section.className = 'mb-8 animate-fade-in';
                
                const header = document.createElement('div');
                header.className = 'mb-4 sticky top-16 z-30 bg-[#121212] py-2 border-b border-zinc-800';
                header.innerHTML = `
                    <h2 class="text-xl text-white font-bold tracking-wide">${monthBlock.month}</h2>
                    <p class="text-sm text-gray-500 uppercase tracking-widest">${monthBlock.subtitle}</p>
                `;
                section.appendChild(header);

                const list = document.createElement('div');
                list.className = 'flex flex-col gap-3';

                monthBlock.events.forEach(event => {
                    totalItems++;
                    const isWatched = watchedItems.includes(event.id);
                    
                    const rowContainer = document.createElement('div');
                    rowContainer.className = `bg-zinc-800 rounded-lg p-3 transition-all duration-300 hover:bg-zinc-700 ${event.type === 'raw' ? 'type-raw' : event.type === 'smackdown' ? 'type-smackdown' : 'type-ple'} ${isWatched ? 'completed' : ''}`;
                    
                    const mainRow = document.createElement('div');
                    mainRow.className = "flex items-center gap-3";

                    let textClass = 'text-gray-200';
                    if (event.type === 'raw') { textClass = 'text-red-400'; }
                    if (event.type === 'smackdown') { textClass = 'text-blue-400'; }
                    if (event.type === 'ple') { textClass = 'text-yellow-400'; }

                    const showName = `WWE ${event.show}`;
                    const episodeDate = `${event.date}, 2025`;

                    mainRow.innerHTML = `
                        <label class="checkbox-wrapper relative flex items-center cursor-pointer p-1">
                            <input type="checkbox" class="sr-only" ${isWatched ? 'checked' : ''} onchange="toggleWatch('${event.id}')">
                            <div class="w-6 h-6 border-2 border-gray-500 rounded flex items-center justify-center transition-colors">
                                <svg class="w-4 h-4 text-white hidden pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>

                            </div>
                        </label>
                        
                        <div class="flex flex-col flex-grow">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold text-gray-500 w-12 text-center uppercase border-r border-gray-600 pr-2 leading-tight">
                                        ${event.date}<br>${event.day}
                                    </span>
                                    <span class="show-title font-bold text-lg ${textClass} wwe-font tracking-wide">${event.show}</span>
                                    ${event.highlight ? '<i class="fas fa-star text-xs text-yellow-500 ml-1"></i>' : ''}
                                </div>
                                
                                <div class="flex gap-2">
                                    <button onclick="copyAndWatch('${showName}', '${episodeDate}')" class="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors flex items-center gap-1 group" title="Open Netflix & Copy '${episodeDate}'">
                                        <i class="fas fa-copy group-hover:hidden"></i>
                                        <i class="fas fa-play hidden group-hover:block"></i>
                                        Watch
                                    </button>
                                    <button id="btn-${event.id}" onclick="triggerHype('${event.id}', '${event.show}', '${event.date}', '${event.note || ''}')" 
                                        class="text-xs bg-zinc-700 hover:bg-zinc-600 text-purple-300 border border-purple-500/30 px-2 py-1 rounded transition-colors flex items-center">
                                        <i class="fas fa-sparkles mr-1"></i> Hype
                                    </button>
                                </div>
                            </div>
                            ${event.note ? `<div class="text-xs text-gray-400 ml-14 mt-1"><i class="fas fa-info-circle mr-1"></i>${event.note}</div>` : ''}
                        </div>
                    `;
                    
                    const hypeContainer = document.createElement('div');
                    hypeContainer.id = `hype-${event.id}`;
                    hypeContainer.className = "hidden mt-3 ml-14 animate-fade-in";

                    rowContainer.appendChild(mainRow);
                    rowContainer.appendChild(hypeContainer);
                    list.appendChild(rowContainer);
                });

                section.appendChild(list);
                container.appendChild(section);
            });

            const progress = totalItems > 0 ? Math.round((watchedItems.length / totalItems) * 100) : 0;
            if(progressBar) progressBar.style.width = `${progress}%`;
            if(progressText) progressText.innerText = `${progress}% Completed`;

            // --- GAMIFICATION UPDATE ---
            const stats = calculateXP();
            const rank = getRank(stats.xp);
            
            // Update Rank UI
            document.getElementById('rank-xp').innerText = `${stats.xp} XP`;
            document.getElementById('rank-title').innerText = rank.title;
            document.getElementById('rank-icon').innerHTML = rank.icon;
            
            // Update Rank Progress Bar (re-using the main progress bar for now, or we could add a specific one)
            // For now, let's just update the "Next Rank" text
            const nextRankText = document.getElementById('next-rank-text');
            if (nextRankText) {
                if (rank.nextXp) {
                    nextRankText.innerText = `Next: ${rank.nextTitle} (${rank.nextXp - stats.xp} XP to go)`;
                } else {
                    nextRankText.innerText = "Max Rank Achieved!";
                }
            }
        }

        // --- GAMIFICATION LOGIC ---
        function calculateXP() {
            let xp = 0;
            scheduleData.forEach(month => {
                month.events.forEach(event => {
                    if (watchedItems.includes(event.id)) {
                        if (event.type === 'ple') xp += 50;
                        else xp += 10;
                    }
                });
            });
            return { xp };
        }

        function getRank(xp) {
            const ranks = [
                { min: 0, title: "NXT Rookie", icon: '<i class="fas fa-user-graduate"></i>' },
                { min: 150, title: "Mid-Carder", icon: '<i class="fas fa-fist-raised"></i>' },
                { min: 400, title: "Main Eventer", icon: '<i class="fas fa-star"></i>' },
                { min: 800, title: "World Champion", icon: '<i class="fas fa-belt"></i>' },
                { min: 1200, title: "Hall of Famer", icon: '<i class="fas fa-crown"></i>' }
            ];

            let currentRank = ranks[0];
            let nextRank = ranks[1];

            for (let i = 0; i < ranks.length; i++) {
                if (xp >= ranks[i].min) {
                    currentRank = ranks[i];
                    nextRank = ranks[i+1] || null;
                }
            }

            return {
                title: currentRank.title,
                icon: currentRank.icon,
                nextXp: nextRank ? nextRank.min : null,
                nextTitle: nextRank ? nextRank.title : null
            };
        }

        window.toggleOracle = function() {
            const modal = document.getElementById('oracle-modal');
            modal.classList.toggle('hidden');
            if (!modal.classList.contains('hidden')) {
                const input = document.getElementById('chat-input');
                if(input) input.focus();
            }
        }

        window.clearChat = function() {
            if(confirm("Clear chat history?")) {
                chatHistory = [];
                document.getElementById('chat-messages').innerHTML = `
                    <div class="flex items-start gap-2">
                        <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-robot text-xs text-white"></i>
                        </div>
                        <div class="bg-zinc-800 rounded-lg p-3 text-sm text-gray-200 max-w-[85%]">
                            I am the 2025 Wrestling Oracle! Ask me about the schedule or storylines!
                        </div>
                    </div>
                `;

                // Clear from Firestore if logged in
                if (currentUser && db) {
                    try {
                        const chatRef = doc(db, 'users', currentUser.uid, 'wwe_data', 'chat');
                        setDoc(chatRef, { history: [], lastUpdated: new Date() }, { merge: true });
                    } catch (e) {
                        console.error("Failed to clear chat:", e);
                    }
                }
            }
        }

        window.handleChatKey = function(e) {
            if (e.key === 'Enter') sendChatMessage();
        }

        window.sendChatMessage = async function() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            input.value = '';

            const loadingId = addLoadingIndicator();

            // Build list of watched event IDs with details
            let watchedList = [];
            scheduleData.forEach(month => {
                month.events.forEach(event => {
                    if (watchedItems.includes(event.id)) {
                        watchedList.push(`${event.date} - ${event.show}${event.note ? ' (' + event.note + ')' : ''}`);
                    }
                });
            });

            // Calculate viewing statistics
            const totalEvents = scheduleData.reduce((sum, m) => sum + m.events.length, 0);
            const completionPercent = Math.round((watchedItems.length / totalEvents) * 100);
            
            // Find upcoming unwatched PLEs
            const upcomingPLEs = [];
            scheduleData.forEach(month => {
                month.events.forEach(event => {
                    if (event.type === 'ple' && !watchedItems.includes(event.id)) {
                        upcomingPLEs.push(`${event.date} - ${event.show}`);
                    }
                });
            });

            // Count by show type
            let watchedByType = { raw: 0, smackdown: 0, ple: 0 };
            scheduleData.forEach(month => {
                month.events.forEach(event => {
                    if (watchedItems.includes(event.id)) {
                        watchedByType[event.type]++;
                    }
                });
            });

            // Get current date dynamically
            const currentDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const systemPrompt = `You are the "WWE Wrestling Oracle" - an AI assistant for WWE 2025 viewing.

📊 USER'S PROFILE:
- Total Progress: ${watchedItems.length}/${totalEvents} events (${completionPercent}%)
- Watched Events: ${watchedList.length > 0 ? watchedList.join(', ') : 'NONE yet'}
- Viewing Breakdown: ${watchedByType.raw} Raw, ${watchedByType.smackdown} SmackDown, ${watchedByType.ple} PLEs
- Current Date: ${currentDate}

📅 SCHEDULE DATA:
${JSON.stringify(scheduleData)}

🎯 YOUR CAPABILITIES:
1. **Answer Questions**: Dates, show types, storyline notes from the schedule
2. **Track Progress**: Tell users what they've watched and what's remaining
3. **Recommend**: Suggest next episodes to watch (prioritize unwatched PLEs: ${upcomingPLEs.slice(0, 3).join(', ') || 'All caught up!'})
4. **Statistics**: Calculate viewing patterns, completion by month, favorite shows
5. **Storyline Context**: Discuss major arcs (Bloodline, Cody vs Owens, Rock's return, etc.)
6. **Spoiler Protection**: Warn before revealing future events they haven't watched
7. **Kayfabe Mode**: Respond enthusiastically in wrestling character style when discussing show notes

📋 RESPONSE GUIDELINES:
- Be enthusiastic and engaging
- Use only data from the schedule
- For unwatched future events, avoid spoilers unless asked
- Suggest logical viewing order (PLEs before following episodes)
- Highlight can't-miss events (denoted with "Must Watch" or "highlight: true")
- If info isn't in the data, say "That's not in the archives"
- Track wrestlers mentioned in notes (The Rock, Cody Rhodes, Roman Reigns, Kevin Owens, etc.)

🎪 EXAMPLE RESPONSES:
- "What should I watch next?" → Recommend unwatched PLEs or storyline-important episodes
- "What have I watched?" → List their ${watchedItems.length} watched events with dates
- "Tell me about [event]" → Share notes in Kayfabe style
- "My progress?" → "${completionPercent}% complete! You've watched ${watchedItems.length} events."`;


            // Format chat history
            const historyContext = chatHistory.length > 0 
                ? `\n\nPREVIOUS CONVERSATION:\n${chatHistory.map(h => `User: ${h.user}\nOracle: ${h.bot}`).join('\n\n')}`
                : "";

            const fullPrompt = systemPrompt + historyContext;

            const response = await window.callGemini(message, fullPrompt);

            removeMessage(loadingId);
            addMessage(response, 'bot');
            
            // Update history
            chatHistory.push({ user: message, bot: response });
            if (chatHistory.length > 10) chatHistory.shift();

            // Save to Firestore if logged in
            if (currentUser && db) {
                try {
                    const chatRef = doc(db, 'users', currentUser.uid, 'wwe_data', 'chat');
                    setDoc(chatRef, { history: chatHistory, lastUpdated: new Date() }, { merge: true });
                } catch (e) {
                    console.error("Failed to save chat:", e);
                }
            }

        }

        function addMessage(text, sender) {
            const chatMessages = document.getElementById('chat-messages');
            const div = document.createElement('div');
            div.className = `flex items-start gap-2 ${sender === 'user' ? 'flex-row-reverse' : ''}`;
            
            // Format the text - convert markdown-like formatting to HTML
            let formattedText = text
                // Convert **bold** to <strong>
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Convert line breaks to <br>
                .replace(/\n/g, '<br>')
                // Convert bullet points
                .replace(/^- (.*?)$/gm, '• $1')
                .replace(/^• /gm, '&nbsp;&nbsp;• ');
            
            const avatar = sender === 'user' 
                ? `<div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0"><i class="fas fa-user text-xs text-gray-300"></i></div>`
                : `<div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-robot text-xs text-white"></i></div>`;
            
            const bubble = `<div class="${sender === 'user' ? 'bg-purple-900/50 text-purple-100' : 'bg-zinc-800 text-gray-200'} rounded-lg p-3 text-sm max-w-[85%] leading-relaxed">
                ${formattedText}
            </div>`;

            div.innerHTML = avatar + bubble;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function addLoadingIndicator() {
            const id = 'loading-' + Date.now();
            const div = document.createElement('div');
            div.id = id;
            div.className = "flex items-start gap-2";
            div.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-robot text-xs text-white"></i></div>
                <div class="bg-zinc-800 rounded-lg p-3 text-sm text-gray-200 typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            `;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return id;
        }

        function removeMessage(id) {
            const el = document.getElementById(id);
            if (el) el.remove();
        }
        // --- AI FUNCTIONS ---
        
        window.callGemini = async function(userMessage, systemPrompt = "") {
            const key = getGeminiKey();
            if (!key) return "Please set your Gemini API key first!";

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: systemPrompt ? `${systemPrompt}\n\nUser: ${userMessage}` : userMessage
                            }]
                        }]
                    })
                });

                const data = await response.json();
                if (data.candidates && data.candidates[0]) {
                    return data.candidates[0].content.parts[0].text;
                }
                return "Sorry, I couldn't generate a response.";
            } catch (error) {
                console.error("Gemini API Error:", error);
                return "Error connecting to AI. Check your API key.";
            }
        }

        window.triggerHype = async function(eventId, showName, showDate, note) {
            const container = document.getElementById(`hype-${eventId}`);
            const button = document.getElementById(`btn-${eventId}`);
            
            if (!container.classList.contains('hidden')) {
                container.classList.add('hidden');
                container.innerHTML = '';
                return;
            }

            button.disabled = true;
            button.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Loading...`;
            
            const prompt = `Write a short (2-3 sentences) hyped-up teaser for this WWE event: "${showName}" on ${showDate}. ${note ? `Event note: ${note}.` : ''} Make it exciting and build anticipation like a wrestling promo!`;
            
            const hype = await window.callGemini(prompt);
            
            container.innerHTML = `
                <div class="bg-purple-900/30 border border-purple-500/30 rounded p-3 text-sm text-purple-100 italic">
                    <i class="fas fa-bolt text-yellow-400 mr-2"></i>${hype}
                </div>
            `;
            container.classList.remove('hidden');
            
            button.disabled = false;
            button.innerHTML = `<i class="fas fa-sparkles mr-1"></i> Hype`;
        }

        window.resetProgress = function() {
            if (confirm("Are you sure you want to reset ALL your progress? This cannot be undone!")) {
                watchedItems = [];
                localStorage.removeItem('wwe2025_progress');
                if (currentUser && db) updateCloudStorage();
                renderApp();
                alert("Progress reset!");
            }
        }
