 // Your web app's Firebase configuration from your project
        const userFirebaseConfig = {
            apiKey: "AIzaSyBBgOF9ZQLjgEHKoBywMT8KfyTUHMaamPs",
            authDomain: "ecofootprint-79c85.firebaseapp.com",
            projectId: "ecofootprint-79c85",
            storageBucket: "ecofootprint-79c85.appspot.com",
            messagingSenderId: "1058027875195",
            appId: "1:1058027875195:web:18b9168085fc1741592bde",
            measurementId: "G-2G85MS6W7C"
        };
        
        // This logic checks for a deployed environment's config first, then falls back to yours.
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : userFirebaseConfig;
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        // Import Firebase modules - Using a newer version from your snippet
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js";
        import { 
            getAuth, 
            createUserWithEmailAndPassword, 
            signInWithEmailAndPassword, 
            signOut, 
            onAuthStateChanged,
            signInWithCustomToken,
            signInAnonymously
        } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

        // Initialize Firebase
        let app, auth, analytics, currentUser = null;
        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            analytics = getAnalytics(app); // Initializing analytics
        } catch (e) {
            console.error("Firebase initialization failed:", e);
        }

        // --- DOM Elements ---
        const pageElements = {
            home: document.getElementById('home-page'),
            quiz: document.getElementById('quiz-page'),
            results: document.getElementById('results-page'),
        };

        const authModal = document.getElementById('auth-modal');
        const authModalContent = document.getElementById('auth-modal-content');

        // --- App State ---
        let currentScore = 0;
        let userAnswers = [];
        let currentQuestionIndex = 0;
        let isLoginMode = false;

        // --- Quiz Data ---
        const quizQuestions = [
            {
                question: "How do you primarily commute to work or school?",
                answers: [
                    { text: "Walk/Bike", points: 5, tip: "Walking or biking is fantastic! You're producing zero emissions." },
                    { text: "Public Transit", points: 15, tip: "Using public transit is a great way to reduce traffic and emissions." },
                    { text: "Carpool", points: 25, tip: "Carpooling is good, but see if you can add more public transit or biking days." },
                    { text: "Drive Alone (Gas Car)", points: 50, tip: "Driving alone adds up. Consider carpooling, public transit, or biking even one day a week to make a big difference." }
                ]
            },
            {
                question: "How often do you eat red meat?",
                answers: [
                    { text: "Never/Rarely", points: 5, tip: "A plant-rich diet has the lowest carbon footprint. Keep it up!" },
                    { text: "A few times a month", points: 20, tip: "Reducing red meat is a powerful climate action. 'Meatless Mondays' are a great start." },
                    { text: "A few times a week", points: 40, tip: "Try swapping one or two red meat meals with chicken, fish, or plant-based options." },
                    { text: "Almost every day", points: 60, tip: "Red meat production is very resource-intensive. Even small reductions can significantly lower your footprint." }
                ]
            },
            {
                question: "How much of your household waste do you recycle?",
                answers: [
                    { text: "Almost everything", points: 5, tip: "Excellent recycling habits! Remember to also reduce and reuse where possible." },
                    { text: "About half", points: 20, tip: "Great start! Check your local guidelines to see what else you can recycle." },
                    { text: "Only some things", points: 35, tip: "Focus on recycling key items like paper, plastic bottles, and cans. It all helps!" },
                    { text: "I don't recycle", points: 50, tip: "Starting is easy! Set up a separate bin for recyclables. It's one of the simplest ways to help." }
                ]
            },
             {
                question: "How mindful are you of your electricity usage?",
                answers: [
                    { text: "Very mindful (unplug devices, use LED bulbs)", points: 10, tip: "You're an energy saver! Keep up the great work of unplugging unused electronics." },
                    { text: "Somewhat mindful", points: 25, tip: "Good habits! Try switching all your bulbs to LEDs for significant energy savings." },
                    { text: "Not very mindful", points: 40, tip: "A simple trick: use power strips to turn off multiple devices at once." },
                    { text: "I leave things on often", points: 60, tip: "Leaving lights and electronics on really adds up. Make it a habit to turn things off when you leave a room." }
                ]
            },
            {
                question: "How often do you buy new clothing?",
                answers: [
                    { text: "Rarely / Second-hand", points: 5, tip: "Thrifting and buying less is a fantastic way to combat fast fashion. Well done!" },
                    { text: "Every few months", points: 15, tip: "You're being conscious of your purchases. Look for quality items that will last longer." },
                    { text: "Every month", points: 30, tip: "The fashion industry has a big footprint. Try a 'no-buy' month challenge!" },
                    { text: "Frequently, I love trends!", points: 45, tip: "Fast fashion comes at a high environmental cost. Consider creating a capsule wardrobe or exploring clothing swaps." }
                ]
            }
        ];

        // --- Page Navigation ---
        const showPage = (pageName) => {
            Object.values(pageElements).forEach(page => page.classList.add('hidden-section'));
            if (pageElements[pageName]) {
                pageElements[pageName].classList.remove('hidden-section');
                pageElements[pageName].classList.add('fade-in');
            }
            if (pageName === 'home') {
                 window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        // --- Quiz Logic ---
        const startQuiz = () => {
            currentScore = 0;
            userAnswers = [];
            currentQuestionIndex = 0;
            showPage('quiz');
            displayQuestion();
        };

        const displayQuestion = () => {
            if (currentQuestionIndex >= quizQuestions.length) {
                showResults();
                return;
            }

            const q = quizQuestions[currentQuestionIndex];
            document.getElementById('quiz-question').textContent = q.question;
            const answersContainer = document.getElementById('quiz-answers');
            answersContainer.innerHTML = '';

            q.answers.forEach(answer => {
                const button = document.createElement('button');
                button.className = 'bg-gray-100 p-4 rounded-lg text-left hover:bg-green-100 hover:border-green-500 border-2 border-transparent transition';
                button.textContent = answer.text;
                button.onclick = () => selectAnswer(answer);
                answersContainer.appendChild(button);
            });
            
            // Update progress bar
            const progress = (currentQuestionIndex / quizQuestions.length) * 100;
            document.getElementById('quiz-progress').style.width = `${progress}%`;
        };

        const selectAnswer = (answer) => {
            currentScore += answer.points;
            userAnswers.push(answer);
            currentQuestionIndex++;
            displayQuestion();
        };
        
        // --- Results Logic ---
        const showResults = () => {
            showPage('results');
            const scoreText = document.getElementById('score-text');
            const scoreCircle = document.getElementById('score-circle');
            const scoreMessage = document.getElementById('score-message');
            const tipsList = document.getElementById('tips-list');
            
            // Normalize score to a 0-100 scale for display
            const minPossibleScore = quizQuestions.reduce((sum, q) => sum + Math.min(...q.answers.map(a => a.points)), 0);
            const maxPossibleScore = quizQuestions.reduce((sum, q) => sum + Math.max(...q.answers.map(a => a.points)), 0);
            const scorePercentage = 100 - ((currentScore - minPossibleScore) / (maxPossibleScore - minPossibleScore)) * 100;
            const finalScore = Math.round(scorePercentage);
            
            let message = '';
            let colorClass = 'text-green-500';

            if (finalScore >= 75) {
                message = "Excellent! You're a true Eco-Champion. Your habits are making a real positive impact.";
                colorClass = 'text-green-500';
            } else if (finalScore >= 50) {
                message = "Great job! You're on the right track. A few small changes can make you even more eco-friendly.";
                colorClass = 'text-yellow-500';
            } else {
                message = "A good starting point. There are many opportunities for you to reduce your footprint and help the planet.";
                colorClass = 'text-red-500';
            }

            scoreText.textContent = finalScore;
            scoreText.className = `absolute inset-0 flex items-center justify-center text-5xl font-bold ${colorClass}`;
            scoreMessage.textContent = message;

            // Animate score circle
            scoreCircle.classList.remove('text-green-500', 'text-yellow-500', 'text-red-500');
            scoreCircle.classList.add(colorClass);
            setTimeout(() => {
                scoreCircle.style.strokeDashoffset = 100 - finalScore;
            }, 100);

            // Display tips
            tipsList.innerHTML = '';
            userAnswers.forEach(answer => {
                if (answer.points > 15) { // Show tips for higher-impact answers
                    const li = document.createElement('li');
                    li.textContent = answer.tip;
                    tipsList.appendChild(li);
                }
            });
            
            updatePDFButtonVisibility();
        };
        
        // --- Auth UI and Logic ---
        const openAuthModal = (startAsLogin = false) => {
            isLoginMode = startAsLogin;
            updateAuthModalUI();
            authModal.classList.remove('hidden');
            authModal.classList.add('flex');
            setTimeout(() => {
                 authModalContent.classList.remove('scale-95', 'opacity-0');
            }, 10);
        };
        
        const closeAuthModal = () => {
            authModalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                authModal.classList.add('hidden');
                authModal.classList.remove('flex');
            }, 300);
        };
        
        const updateAuthModalUI = () => {
            document.getElementById('auth-title').textContent = isLoginMode ? 'Log In' : 'Sign Up for EcoTrack';
            document.getElementById('auth-submit-btn').textContent = isLoginMode ? 'Log In' : 'Create Account';
            document.getElementById('auth-switch-text').textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
            document.getElementById('auth-switch-btn').textContent = isLoginMode ? 'Sign Up' : 'Log In';
            document.getElementById('auth-error').textContent = '';
            document.getElementById('auth-form').reset();
        };
        
        const updateNavForAuth = (user) => {
            currentUser = user;
            const authActionBtn = document.getElementById('auth-action-btn');
            const mobileAuthActionBtn = document.getElementById('mobile-auth-action-btn');
            if(user) {
                authActionBtn.textContent = 'Sign Out';
                mobileAuthActionBtn.textContent = 'Sign Out';
            } else {
                authActionBtn.textContent = 'Sign Up';
                mobileAuthActionBtn.textContent = 'Sign Up';
            }
            updatePDFButtonVisibility();
        };

        const updatePDFButtonVisibility = () => {
            const downloadBtn = document.getElementById('download-pdf-btn');
            const loginPrompt = document.getElementById('pdf-login-prompt');
            if (currentUser) {
                downloadBtn.classList.remove('hidden');
                loginPrompt.classList.add('hidden');
            } else {
                downloadBtn.classList.add('hidden');
                loginPrompt.classList.remove('hidden');
            }
        };

        // --- PDF Generation ---
        const generatePDF = () => {
            if (!currentUser) {
                openAuthModal(true);
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const finalScore = document.getElementById('score-text').textContent;
            const message = document.getElementById('score-message').textContent;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(34, 139, 34); // Green color
            doc.text("Your EcoTrack Footprint Report", 105, 20, null, null, 'center');
            
            doc.setFontSize(40);
            doc.text(`Score: ${finalScore}`, 105, 50, null, null, 'center');
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(doc.splitTextToSize(message, 180), 15, 70);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(34, 139, 34);
            doc.text("Your Personalized Tips:", 15, 100);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(100);
            const tips = Array.from(document.getElementById('tips-list').children).map(li => li.textContent);
            let y = 110;
            tips.forEach(tip => {
                 if (y > 270) { // Add new page if content overflows
                    doc.addPage();
                    y = 20;
                 }
                 doc.text(`• ${doc.splitTextToSize(tip, 170)}`, 20, y);
                 y += 15;
            });
            
            doc.save(`EcoTrack-Report-${new Date().toISOString().slice(0,10)}.pdf`);
        };

        // --- Event Listeners ---
        document.getElementById('hamburger-btn').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        document.querySelectorAll('#nav-quiz-btn, #mobile-quiz-btn, #landing-quiz-btn').forEach(btn => {
            btn.addEventListener('click', startQuiz);
        });
        
        document.getElementById('restart-quiz-btn').addEventListener('click', startQuiz);
        document.getElementById('download-pdf-btn').addEventListener('click', generatePDF);
        
        // Auth-related listeners
        document.querySelectorAll('#auth-action-btn, #mobile-auth-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentUser) {
                    signOut(auth);
                } else {
                    openAuthModal(false); // Open as Sign Up
                }
            });
        });
        document.getElementById('login-prompt-link').addEventListener('click', () => openAuthModal(true));

        document.getElementById('close-modal-btn').addEventListener('click', closeAuthModal);
        document.getElementById('auth-switch-btn').addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            updateAuthModalUI();
        });

        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('auth-error');
            errorEl.textContent = '';
            
            try {
                if (isLoginMode) {
                    await signInWithEmailAndPassword(auth, email, password);
                } else {
                    await createUserWithEmailAndPassword(auth, email, password);
                }
                closeAuthModal();
            } catch (error) {
                console.error("Auth Error:", error);
                errorEl.textContent = error.message.replace('Firebase: ', '');
            }
        });
        
        // Listener for clicks outside the auth modal
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });

        // Anchor link smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#home' || targetId === '#') {
                    showPage('home');
                } else if (targetId.length > 1) {
                    document.querySelector(targetId)?.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
                // Close mobile menu on click
                 document.getElementById('mobile-menu').classList.add('hidden');
            });
        });

        // --- Firebase Auth State Management ---
        if(auth){
             onAuthStateChanged(auth, (user) => {
                updateNavForAuth(user);
             });
            
             // Authenticate user with custom token if provided, otherwise sign in anonymously
             const authenticateUser = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        // This was causing issues in some environments.
                        // await signInAnonymously(auth);
                    }
                } catch(error) {
                    console.error("Authentication failed:", error);
                }
             };
             // We will not call authenticateUser() on page load to simplify the auth flow.
             // The onAuthStateChanged listener above is sufficient.
        }

        // --- Initial Load ---
        showPage('home');
