import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    doc, 
    setDoc, 
    getDoc,
    writeBatch,
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import { Smile, Frown, Meh, Wind, Brain, Moon, Sun, User, LogOut, BookOpen, X, ChevronLeft, ChevronRight, CheckCircle, MessageSquare, Send, Trash2, PlusSquare, AlertTriangle } from 'lucide-react';

/*
* FONT INTEGRATION NOTE:
* For the custom fonts to work, add the following line to the <head> of your public/index.html file:
* <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Nunito+Sans:wght@400;700&display=swap" rel="stylesheet">
*/

// --- Firebase Configuration ---
// IMPORTANT: Replace these placeholder values with your own Firebase project configuration keys.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'horizon-mvp-final';

// --- Auth Context ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, `artifacts/${appId}/users`, firebaseUser.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUser({ ...firebaseUser, ...docSnap.data() });
                } else {
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const value = { user };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// --- Theme Context ---
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// --- Main App Component ---
export default function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <MainApp />
            </ThemeProvider>
        </AuthProvider>
    );
}

function MainApp() {
    const { user } = useContext(AuthContext);
    const [page, setPage] = useState('login'); // Start at login page

    useEffect(() => {
        if (user) {
            setPage('home');
        } else {
            // Only force back to login if not already on signup
            if (page !== 'signup') {
                setPage('login');
            }
        }
    }, [user]);

    const renderPage = () => {
        if (!user) {
            if (page === 'signup') {
                return <SignUpPage setPage={setPage} />;
            }
            return <LoginPage setPage={setPage} />;
        }

        return (
            <div className="flex flex-col min-h-screen font-nunito">
                <Navbar setPage={setPage} />
                <main className="flex-grow w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {
                        {
                            'home': <HomePage setPage={setPage} />,
                            'breathe-ease': <BreatheAndEasePage setPage={setPage} />,
                            'mood-check': <MoodCheckPage setPage={setPage} />,
                            'heart-journal': <HeartJournalPage setPage={setPage} />,
                            'chatbot': <ChatbotPage setPage={setPage} />,
                            'profile': <ProfilePage setPage={setPage} />,
                            'crisis': <CrisisSupportPage setPage={setPage} />,
                        }[page] || <HomePage setPage={setPage} />
                    }
                </main>
                <Footer setPage={setPage} />
            </div>
        );
    };

    return (
        <div className="bg-slate-50 dark:bg-gray-900 min-h-screen font-nunito text-gray-800 dark:text-gray-200 transition-colors duration-300">
            {renderPage()}
        </div>
    );
}

// --- Authentication Pages ---
const AuthForm = ({ isLogin, setPage }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (isLogin) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                setError(err.message);
            }
        } else {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setLoading(false);
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, `artifacts/${appId}/users`, user.uid), {
                    name,
                    age,
                    email,
                });
            } catch (err) {
                setError(err.message);
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-gray-800 font-nunito p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                <div className="flex-shrink-0 flex flex-col leading-tight text-center mb-4">
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-3xl font-bold text-teal-600 dark:text-teal-400 font-lora">Mind</h1>
                        <Brain size={28} className="text-teal-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-teal-600 dark:text-teal-400 font-lora">Connect</h1>
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 font-lora">
                    {isLogin ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block">Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 mt-1 text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                            </div>
                             <div>
                                <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block">Age</label>
                                <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full p-3 mt-1 text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 mt-1 text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 mt-1 text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                    </div>
                     {!isLogin && (
                        <div>
                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block">Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 mt-1 text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm text-center">{error.replace('Firebase: ', '')}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3 mt-4 font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-teal-400">
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setPage(isLogin ? 'signup' : 'login')} className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

const LoginPage = ({ setPage }) => <AuthForm isLogin={true} setPage={setPage} />;
const SignUpPage = ({ setPage }) => <AuthForm isLogin={false} setPage={setPage} />;

// --- Core UI Components ---
const Navbar = ({ setPage }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Home', page: 'home' }, { name: 'Breathe & Ease', page: 'breathe-ease' },
        { name: 'Mood Check', page: 'mood-check' }, { name: 'Heart Journal', page: 'heart-journal' },
        { name: 'AI Friend', page: 'chatbot' },
    ];

    return (
        <nav className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg sticky top-0 z-40 shadow-sm">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => setPage('home')}>
                        <div className="flex flex-col leading-tight">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-lora">Mind</h1>
                                <Brain size={24} className="text-teal-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-lora">Connect</h1>
                        </div>
                    </div>
                    <div className="hidden md:flex items-baseline space-x-4">
                        {navLinks.map(link => (
                             <button key={link.name} onClick={() => setPage(link.page)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                {link.name}
                            </button>
                        ))}
                    </div>
                    <div className="hidden md:flex items-center space-x-3">
                        <button onClick={() => setPage('crisis')} className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors">
                            Crisis Support
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <button onClick={() => setPage('profile')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <User size={20} />
                        </button>
                    </div>
                    <div className="md:hidden flex items-center">
                         <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md">
                            {isMenuOpen ? <X size={24} /> : <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>}
                        </button>
                    </div>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map(link => (
                             <button key={link.name} onClick={() => { setPage(link.page); setIsMenuOpen(false); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                {link.name}
                            </button>
                        ))}
                         <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                         <button onClick={() => { setPage('crisis'); setIsMenuOpen(false); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300">Crisis Support</button>
                         <button onClick={() => { setPage('profile'); setIsMenuOpen(false); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">Profile</button>
                         <button onClick={toggleTheme} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">Toggle Theme</button>
                    </div>
                </div>
            )}
        </nav>
    );
};

const Footer = ({ setPage }) => (
    <footer className="bg-gray-100 dark:bg-gray-800 mt-12">
        <div className="container mx-auto py-8 px-4 max-w-7xl text-center text-gray-600 dark:text-gray-400">
            <p className="text-sm mb-4">
                <span className="font-bold">Disclaimer:</span> Mind Connect is a support tool, not a replacement for professional medical advice. If you are in crisis, please seek immediate help.
            </p>
            <div className="flex justify-center space-x-6 mb-4">
                <button onClick={() => setPage('home')} className="text-sm hover:underline">Home</button>
                <button onClick={() => setPage('breathe-ease')} className="text-sm hover:underline">Breathe & Ease</button>
                <button onClick={() => setPage('crisis')} className="text-sm hover:underline">Crisis Support</button>
            </div>
            <p className="text-xs">&copy; {new Date().getFullYear()} Mind Connect. All Rights Reserved.</p>
        </div>
    </footer>
);

const PageHeader = ({ title, onBack }) => (
    <header className="flex items-center mb-6">
        {onBack && <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronLeft size={24} /></button>}
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-100 ml-4 font-lora">{title}</h1>
    </header>
);

// --- Home Page ---
const HomePage = ({ setPage }) => {
    const { user } = useContext(AuthContext);
    const welcomeName = user?.name || 'there';
    const affirmations = [ "You are doing the best you can, and that is enough.", "You don’t have to have it all figured out right now.", "You are allowed to rest. Rest is productive.", "You are stronger than the thoughts trying to bring you down.", "You have overcome so much already. You can face this too.", "You deserve peace, even on the busiest days.", "You are not behind. You are exactly where you need to be.", "You can breathe through this moment. Just one breath at a time.", "You are safe right now. Let your body soften.", "You are worthy of love and care—even from yourself.", "You don’t need to carry it all alone. It's okay to ask for help.", "You are more than your worries. You are whole.", "You have permission to pause. Everything can wait.", "You are not a burden for feeling this way.", "You are allowed to feel all your emotions without judgment.", "You are capable of creating calm within the chaos.", "You matter, even on the days you feel invisible.", "You are growing through what you’re going through.", "You have handled difficult things before. You will again.", "You are enough, just as you are.", ];
    
    return (
        <div className="animate-fadeIn space-y-16 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <header className="text-center lg:text-left">
                    <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-gray-800 dark:text-gray-100 font-lora">Welcome, {welcomeName}.</h1>
                    <p className="mt-4 text-lg xl:text-xl text-gray-600 dark:text-gray-300">Mind Connect is a safe space designed to help you navigate your feelings, find calm, and build a stronger connection with yourself.</p>
                </header>
                <AffirmationCarousel affirmations={affirmations} />
            </div>
            <FeatureGrid setPage={setPage} />
            <LearnGrid />
        </div>
    );
};

const AffirmationCarousel = ({ affirmations }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const colors = [ 
        "from-blue-200 to-cyan-200 dark:from-blue-300/70 dark:to-cyan-400/70", 
        "from-purple-200 to-violet-200 dark:from-purple-300/70 dark:to-violet-400/70", 
        "from-green-200 to-emerald-200 dark:from-green-300/70 dark:to-emerald-400/70", 
        "from-amber-200 to-yellow-200 dark:from-amber-300/70 dark:to-yellow-400/70", 
        "from-pink-200 to-rose-200 dark:from-pink-300/70 dark:to-rose-400/70", 
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % affirmations.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [affirmations.length]);

    return (
        <div className="h-64 rounded-2xl overflow-hidden relative shadow-lg">
            <div className={`w-full h-full bg-gradient-to-br ${colors[currentIndex % colors.length]} transition-all duration-1000 flex items-center justify-center p-8`}>
                <p className="text-2xl lg:text-3xl font-semibold text-center text-gray-800 dark:text-gray-900 font-lora">"{affirmations[currentIndex]}"</p>
            </div>
        </div>
    );
};

const FeatureGrid = ({ setPage }) => {
    const features = [
        { title: "Breathe & Ease", description: "Immediate tools for distress.", page: "breathe-ease", icon: <Wind size={28}/> },
        { title: "Mood Check", description: "Check in with your feelings.", page: "mood-check", icon: <Smile size={28}/> },
        { title: "Heart Journal", description: "Reflect on your thoughts.", page: "heart-journal", icon: <BookOpen size={28}/> },
        { title: "AI Friend", description: "Chat for encouragement.", page: "chatbot", icon: <MessageSquare size={28}/> },
    ];

    return (
        <div className="pt-8">
            <h2 className="text-center text-3xl xl:text-4xl font-bold mb-8 font-lora">Explore Your Space</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map(feature => (
                     <div key={feature.title} onClick={() => setPage(feature.page)} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 flex flex-col items-center text-center">
                        <div className="text-teal-500 mb-3">{feature.icon}</div>
                        <h3 className="font-lora text-xl font-bold text-gray-800 dark:text-gray-100">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LearnGrid = () => {
    const qna = [
        { q: "What is anxiety, stress, and depression?", a: "Anxiety is when your mind keeps worrying, even when nothing is wrong. Stress happens when you're under pressure and feel like things are too much. Depression is a lasting sadness that doesn’t go away easily and affects how you live." },
        { q: "How to identify triggers?", a: "Triggers are moments or thoughts that suddenly shift your mood. Notice what was happening before you felt anxious or sad. Writing it down helps you see patterns and learn how to handle them better." },
        { q: "What is therapy really like?", a: "Therapy is a safe, private space to talk with a trained professional. It’s not about being “broken,” but about learning tools to cope, express yourself, and feel lighter. Every session is based on trust and healing at your pace." },
        { q: "How to support a friend who’s struggling?", a: "Be there without judgment. Listen more than you speak, and offer reassurance like, “I care about you.” Avoid trying to “fix” them. Encourage them to talk to a professional and check in regularly so they don’t feel alone." },
        { q: "Why track emotions?", a: "Tracking your emotions helps you become more aware of what you’re feeling and why. It shows you patterns over time—like what uplifts you and what drains you. This helps in managing emotions instead of feeling controlled by them." },
        { q: "How to build healthy boundaries?", a: "Boundaries are limits that protect your mental health. It’s okay to say no or take time for yourself. Healthy boundaries don’t push people away—they help build stronger, more respectful relationships." },
        { q: "What are panic attacks?", a: "Panic attacks are sudden waves of intense fear with physical symptoms like a rapid heartbeat. They can feel terrifying but are not dangerous. Grounding exercises and deep breathing can help you stay calm." },
        { q: "Difference between a psychologist, therapist, and psychiatrist?", a: "A therapist helps you cope via talk sessions. A psychologist also does therapy and may conduct tests. A psychiatrist is a medical doctor who can prescribe medication if needed. All are here to support you." },
        { q: "Understanding your inner critic and self-compassion?", a: "The inner critic is the voice that says you’re not good enough. Self-compassion is learning to talk to yourself with kindness instead. Notice when you’re being harsh and try saying something gentle, like you would to a friend." },
    ];
    const [selectedCard, setSelectedCard] = useState(null);

    return (
        <div className="pt-8">
            <h2 className="text-center text-3xl xl:text-4xl font-bold mb-8 font-lora">Healing Insights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {qna.map((item, index) => (
                    <button key={index} onClick={() => setSelectedCard(item)} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl dark:hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1 text-left h-full flex">
                        <h4 className="font-lora text-lg font-bold text-teal-600 dark:text-teal-400 self-center">{item.q}</h4>
                    </button>
                ))}
            </div>
            {selectedCard && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn p-4" onClick={() => setSelectedCard(null)}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-xl font-lora text-teal-600 dark:text-teal-400 pr-4">{selectedCard.q}</h3>
                            <button onClick={() => setSelectedCard(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"><X size={24} /></button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{selectedCard.a}</p>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Breathe & Ease Page & Components ---
const BreatheAndEasePage = ({ setPage }) => {
    const [activeTool, setActiveTool] = useState(null);
    const tools = { boxBreathing: { title: "Box Breathing" }, "478Breathing": { title: "4-7-8 Breathing" }, pacedBreathing: { title: "Paced Breathing" }, grounding: { title: "5-4-3-2-1 Grounding" }, meditation: { title: "Meditation Timer" }, };
    
    const renderTool = () => {
        switch(activeTool) {
            case 'boxBreathing': return <BreathingExercise type="box" />;
            case '478Breathing': return <BreathingExercise type="478" />;
            case 'pacedBreathing': return <BreathingExercise type="paced" />;
            case 'grounding': return <GroundingTechnique />;
            case 'meditation': return <Meditation />;
            default: return null;
        }
    }

    if (activeTool) {
        return (
            <div className="animate-fadeIn">
                <PageHeader title={tools[activeTool].title} onBack={() => setActiveTool(null)} />
                {renderTool()}
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <PageHeader title="Breathe & Ease" onBack={() => setPage('home')} />
            <p className="text-gray-600 dark:text-gray-400 mb-6">Tools to help you find calm in moments of high anxiety or stress.</p>
            <div className="space-y-4 max-w-lg mx-auto">
                {Object.entries(tools).map(([key, { title }]) => (
                    <button key={key} onClick={() => setActiveTool(key)} className="w-full text-left bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md dark:hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 font-lora">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">A tool to find your center.</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const BreathingExercise = ({ type }) => {
    const [step, setStep] = useState('Start');
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef(null);
    const stepIndexRef = useRef(0);
    const sequences = { box: [{ name: 'Inhale', duration: 4 }, { name: 'Hold', duration: 4 }, { name: 'Exhale', duration: 4 }, { name: 'Hold', duration: 4 }], '478': [{ name: 'Inhale', duration: 4 }, { name: 'Hold', duration: 7 }, { name: 'Exhale', duration: 8 }], paced: [{ name: 'Inhale', duration: 5 }, { name: 'Exhale', duration: 5 }], };
    const sequence = sequences[type];

    const runSequence = () => {
        const currentStep = sequence[stepIndexRef.current];
        setStep(currentStep.name);
        timerRef.current = setTimeout(() => {
            stepIndexRef.current = (stepIndexRef.current + 1) % sequence.length;
            runSequence();
        }, currentStep.duration * 1000);
    };

    const handleStartStop = () => {
        if (isActive) {
            setIsActive(false);
            clearTimeout(timerRef.current);
            setStep('Start');
        } else {
            setIsActive(true);
            stepIndexRef.current = 0;
            runSequence();
        }
    };

    useEffect(() => { return () => clearTimeout(timerRef.current); }, []);

    return (
        <div className="text-center flex flex-col items-center justify-center p-4">
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                <div className={`absolute inset-0 bg-teal-300/40 dark:bg-teal-900/50 rounded-full transition-transform duration-1000 ${isActive ? 'scale-110' : 'scale-100'}`}></div>
                <div className="w-36 h-36 bg-teal-400 dark:bg-teal-600 rounded-full flex items-center justify-center transition-transform duration-500">
                    <span className="text-3xl font-bold text-teal-900 dark:text-white">{step}</span>
                </div>
            </div>
            <button onClick={handleStartStop} className={`font-bold py-3 px-8 rounded-lg transition-colors ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-700'} text-white`}>{isActive ? 'Stop' : 'Begin'}</button>
        </div>
    );
};

const GroundingTechnique = () => {
    const steps = [ { num: 5, text: "things you can SEE", icon: "👁️" }, { num: 4, text: "things you can TOUCH", icon: "🖐️" }, { num: 3, text: "things you can HEAR", icon: "👂" }, { num: 2, text: "things you can SMELL", icon: "👃" }, { num: 1, text: "thing you can TASTE", icon: "👅" }, ];
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <div className="text-center p-4 flex flex-col items-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md w-full max-w-sm mb-6">
                <div className="text-6xl mb-4">{steps[currentStep].icon}</div>
                <p className="text-2xl font-bold font-lora">Acknowledge...</p>
                <p className="text-4xl font-bold text-teal-600 dark:text-teal-400 my-2">{steps[currentStep].num}</p>
                <p className="text-2xl font-bold">{steps[currentStep].text}</p>
            </div>
            <div className="flex justify-between w-full max-w-sm">
                <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0} className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-2 px-6 rounded-lg disabled:opacity-50">Prev</button>
                <button onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))} disabled={currentStep === steps.length - 1} className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">Next</button>
            </div>
        </div>
    );
};

const Meditation = () => {
    const [duration, setDuration] = useState(600);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef(null);

    const startTimer = () => { setIsActive(true); timerRef.current = setInterval(() => { setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); setIsActive(false); return 0; } return prev - 1; }); }, 1000); };
    const stopTimer = () => { clearInterval(timerRef.current); setIsActive(false); setTimeLeft(duration); };
    useEffect(() => { setTimeLeft(duration); return () => clearInterval(timerRef.current); }, [duration]);
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60) < 10 ? '0' : ''}${seconds % 60}`;
    const progress = ((duration - timeLeft) / duration) * 100;

    return (
        <div className="text-center flex flex-col items-center justify-center p-4">
            {!isActive && (
                <div className="flex space-x-4 mb-8">
                    <button onClick={() => setDuration(600)} className={`px-4 py-2 rounded-lg ${duration === 600 ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>10 min</button>
                    <button onClick={() => setDuration(1200)} className={`px-4 py-2 rounded-lg ${duration === 1200 ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>20 min</button>
                </div>
            )}
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle className="text-gray-200 dark:text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" /><circle className="text-teal-500" strokeWidth="10" strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style={{ strokeDasharray: 283, strokeDashoffset: 283 - (progress / 100) * 283, transition: 'stroke-dashoffset 1s linear' }} /></svg>
                <span className="absolute text-4xl font-bold">{formatTime(timeLeft)}</span>
            </div>
            <button onClick={isActive ? stopTimer : startTimer} className={`font-bold py-3 px-8 rounded-lg transition-colors ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-700'} text-white`}>{isActive ? 'Stop' : 'Start'}</button>
        </div>
    );
};

// --- Mood Check Page & Components ---
const MoodCheckPage = ({ setPage }) => {
    const [view, setView] = useState('log');
    const [logs, setLogs] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/mood_logs`), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const logsData = [];
            querySnapshot.forEach((doc) => {
                logsData.push({ id: doc.id, ...doc.data(), date: doc.data().timestamp.toDate() });
            });
            setLogs(logsData);
        });
        return () => unsubscribe();
    }, [user]);

    return (
        <div className="animate-fadeIn">
            <PageHeader title="Mood Check" onBack={() => setPage('home')} />
            <div className="flex justify-center mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-1 space-x-1 bg-gray-100 dark:bg-gray-800 max-w-xs mx-auto">
                <button onClick={() => setView('log')} className={`w-full py-2 rounded-md transition-colors text-sm font-medium ${view === 'log' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>New Log</button>
                <button onClick={() => setView('calendar')} className={`w-full py-2 rounded-md transition-colors text-sm font-medium ${view === 'calendar' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>History</button>
            </div>
            {view === 'log' ? <NewMoodLog /> : <MoodCalendar logs={logs} />}
        </div>
    );
};

const AnimatedEmoji = ({ value }) => {
    const mouthD = `M 30, ${65 + value * 0.1} Q 50, ${65 + value * 0.35} 70, ${65 + value * 0.1}`;
    const eyeScale = 1 + Math.abs(value - 50) / 150;
    const color = `hsl(${120 * (value/100)}, 70%, 85%)`;

    return (
        <div className="w-48 h-48 rounded-3xl shadow-lg flex items-center justify-center transition-colors" style={{backgroundColor: color}}>
            <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
                <circle cx="35" cy="40" r="5" fill="black" transform={`scale(${eyeScale})`} transform-origin="35 40" />
                <circle cx="65" cy="40" r="5" fill="black" transform={`scale(${eyeScale})`} transform-origin="65 40" />
                <path d={mouthD} stroke="black" strokeWidth="3" fill="transparent" strokeLinecap="round" />
            </svg>
        </div>
    );
};

const NewMoodLog = () => {
    const [moodValue, setMoodValue] = useState(50);
    const [answers, setAnswers] = useState({});
    const [isSaved, setIsSaved] = useState(false);
    const { user } = useContext(AuthContext);
    const questions = [ "One good moment today?", "A word to describe your strength today?", "One hard moment today?", "A feeling you want to let go?", "What challenged you?", "Energy level right now?", "A small win today?", "One supportive person today?", "One intention for tomorrow?" ];

    const getMoodDescription = (value) => {
        if (value < 20) return "Very Bad";
        if (value < 40) return "Bad";
        if (value < 60) return "Okay";
        if (value < 80) return "Good";
        return "Great";
    };
    
    const handleAnswerChange = (q, value) => setAnswers(prev => ({ ...prev, [q]: value }));
    const handleSubmit = async () => {
        if (!user) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/mood_logs`), {
            mood: getMoodDescription(moodValue),
            moodValue,
            answers,
            timestamp: serverTimestamp(),
        });
        setIsSaved(true);
        setMoodValue(50);
        setAnswers({});
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm space-y-6 max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-4">
                <h3 className="text-xl font-bold text-center font-lora">How are you feeling?</h3>
                <AnimatedEmoji value={moodValue} />
                <p className="text-2xl font-bold font-lora">{getMoodDescription(moodValue)}</p>
                <div className="w-full px-4">
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={moodValue} 
                        onChange={(e) => setMoodValue(e.target.value)} 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Very Bad</span>
                        <span>Great</span>
                    </div>
                </div>
            </div>
            <div className="space-y-4 animate-fadeIn pt-4 border-t border-gray-200 dark:border-gray-700">
                {questions.map(q => ( <div key={q} className="mb-4"><label className="font-semibold text-gray-700 dark:text-gray-300">{q}</label><input type="text" value={answers[q] || ''} onChange={e => handleAnswerChange(q, e.target.value)} className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" /></div> ))}
                <button onClick={handleSubmit} className="w-full py-3 font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">Save Log</button>
            </div>
            {isSaved && <div className="flex items-center justify-center gap-2 text-green-600 mt-2"><CheckCircle size={20} /><span>Your mood log has been saved!</span></div>}
        </div>
    );
};

const MoodCalendar = ({ logs }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedLog, setSelectedLog] = useState(null);
    const moodColors = { Great: 'bg-green-500', Good: 'bg-green-400', Okay: 'bg-yellow-400', Bad: 'bg-blue-400', "Very Bad": 'bg-blue-500' };
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const changeMonth = (offset) => setCurrentDate(prev => { const newDate = new Date(prev); newDate.setMonth(prev.getMonth() + offset); return newDate; });

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-4"><button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft/></button><h3 className="font-bold text-lg font-lora">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3><button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight/></button></div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={`${day}-${index}`}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }).map((_, day) => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1);
                    const logForDay = logs.find(log => new Date(log.date).toDateString() === date.toDateString());
                    return ( <div key={day} className="h-10 flex items-center justify-center"><button onClick={() => setSelectedLog(logForDay)} disabled={!logForDay} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${logForDay ? `${moodColors[logForDay.mood]} text-white cursor-pointer hover:ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-teal-400` : 'text-gray-400 dark:text-gray-500'}`}>{day + 1}</button></div> );
                })}
            </div>
            {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
};

const LogDetailModal = ({ log, onClose }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn p-4"><div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-md w-full"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg font-lora">{new Date(log.date).toLocaleDateString()} - Mood: {log.mood}</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button></div><div className="space-y-2 text-sm max-h-80 overflow-y-auto pr-2">{Object.entries(log.answers).map(([q, a]) => ( <div key={q}><p className="font-semibold text-gray-800 dark:text-gray-200">{q}</p><p className="text-gray-600 dark:text-gray-400">{a || 'No answer'}</p></div> ))}</div></div></div>
);

// --- Heart Journal Page & Components ---
const HeartJournalPage = ({ setPage }) => {
    const [view, setView] = useState('write');
    const [entries, setEntries] = useState([]);
    const { user } = useContext(AuthContext);

     useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/journal_entries`), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const entriesData = [];
            querySnapshot.forEach((doc) => {
                entriesData.push({ id: doc.id, ...doc.data(), date: doc.data().timestamp.toDate() });
            });
            setEntries(entriesData);
        });
        return () => unsubscribe();
    }, [user]);

    return (
        <div className="animate-fadeIn">
            <PageHeader title="Heart Journal" onBack={() => setPage('home')} />
            <div className="flex justify-center mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-1 space-x-1 bg-gray-100 dark:bg-gray-800 max-w-xs mx-auto">
                <button onClick={() => setView('write')} className={`w-full py-2 rounded-md transition-colors text-sm font-medium ${view === 'write' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>New Entry</button>
                <button onClick={() => setView('calendar')} className={`w-full py-2 rounded-md transition-colors text-sm font-medium ${view === 'calendar' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Past Entries</button>
            </div>
            {view === 'write' ? <NewJournalEntry /> : <JournalCalendar entries={entries} />}
        </div>
    );
};

const NewJournalEntry = () => {
    const [entry, setEntry] = useState('');
    const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const { user } = useContext(AuthContext);

    const getAIPrompt = async () => {
        setIsLoadingPrompt(true);
        setEntry("Generating a prompt for you...");
        try {
            const payload = { contents: [{ role: 'user', parts: [{ text: "Give me a single, thoughtful journal prompt for self-reflection. Make it concise and open-ended." }] }] };
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            const prompt = result.candidates[0].content.parts[0].text;
            setEntry(prompt.replace(/"/g, '') + '\n\n');
        } catch (error) { setEntry("I couldn't get a prompt right now. Feel free to write about anything on your mind."); } 
        finally { setIsLoadingPrompt(false); }
    };

    const handleSubmit = async () => {
        if (!entry.trim() || !user) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/journal_entries`), {
            text: entry,
            timestamp: serverTimestamp(),
        });
        setIsSaved(true);
        setEntry('');
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm space-y-4 max-w-2xl mx-auto">
            <div className="flex space-x-4">
                <button onClick={getAIPrompt} disabled={isLoadingPrompt} className="flex-1 py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors">Get a Prompt</button>
                <button onClick={() => setEntry('')} className="flex-1 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Write Freely</button>
            </div>
            <textarea value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="What's on your mind today?" className="w-full p-3 h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"></textarea>
            <button onClick={handleSubmit} className="w-full py-3 font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">Save Entry</button>
            {isSaved && <div className="flex items-center justify-center gap-2 text-green-600 mt-2"><CheckCircle size={20} /><span>Your journal entry has been saved!</span></div>}
        </div>
    );
};

const JournalCalendar = ({ entries }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEntry, setSelectedEntry] = useState(null);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const changeMonth = (offset) => setCurrentDate(prev => { const newDate = new Date(prev); newDate.setMonth(prev.getMonth() + offset); return newDate; });

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-4"><button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft/></button><h3 className="font-bold text-lg font-lora">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3><button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight/></button></div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={`${day}-${index}`}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }).map((_, day) => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1);
                    const entryForDay = entries.find(entry => new Date(entry.date).toDateString() === date.toDateString());
                    return ( <div key={day} className="h-10 flex items-center justify-center"><button onClick={() => setSelectedEntry(entryForDay)} disabled={!entryForDay} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${entryForDay ? 'bg-purple-400 dark:bg-purple-500 text-white cursor-pointer hover:ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>{day + 1}</button></div> );
                })}
            </div>
            {selectedEntry && <JournalDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
        </div>
    );
};

const JournalDetailModal = ({ entry, onClose }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn p-4"><div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-lg w-full"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg font-lora">Journal Entry - {new Date(entry.date).toLocaleDateString()}</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button></div><div className="text-sm max-h-96 overflow-y-auto pr-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300">{entry.text}</div></div></div>
);

// --- AI Chatbot Page ---

// This is the new Confirmation Modal component
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    // This now controls its own visibility based on the 'message' prop
    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 m-4 max-w-sm w-full text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Confirm Deletion</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {message}
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Chatbot Page Component ---

const ChatbotPage = ({ setPage }) => {
    // This should be your actual App ID from your environment
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    // --- FIX 1: Only get 'user' from context. 'db' is imported directly. ---
    const { user } = useContext(AuthContext);

    // State for the main chat window
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // State for managing chat sessions
    const [chatSessions, setChatSessions] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);

    // State for the modal now holds the chat ID or null
    const [chatToDelete, setChatToDelete] = useState(null);

    const messagesEndRef = useRef(null);

    const initialMessage = { id: 'initial', text: "Hello! I'm Echo. Think of me as a friendly ear, here to listen without judgment. What's on your mind today?", sender: 'ai' };

    // --- EFFECTS ---
    useEffect(() => {
        if (!user || !db) return;
        const chatsRef = collection(db, `artifacts/${appId}/users/${user.uid}/chats`);
        const q = query(chatsRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setChatSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user, db, appId]);

    useEffect(() => {
        if (!user || !db) return;
        if (activeChatId === null) {
            setMessages([initialMessage]);
            return;
        }
        const messagesRef = collection(db, `artifacts/${appId}/users/${user.uid}/chats/${activeChatId}/messages`);
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user, db, activeChatId, appId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // --- HANDLERS ---

    const handleSend = async () => {
        if (!input.trim() || isLoading || !user) return;

        const userInput = input;
        setInput('');
        setIsLoading(true);

        let currentChatId = activeChatId;

        if (currentChatId === null) {
            try {
                const chatDocRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/chats`), {
                    title: userInput.substring(0, 35) + (userInput.length > 35 ? '...' : ''),
                    createdAt: serverTimestamp()
                });
                currentChatId = chatDocRef.id;
                setActiveChatId(currentChatId);
            } catch (error) {
                console.error("Error creating new chat session:", error);
                setIsLoading(false);
                return;
            }
        }

        const messagesRef = collection(db, `artifacts/${appId}/users/${user.uid}/chats/${currentChatId}/messages`);
        const newUserMessage = { text: userInput, sender: 'user', timestamp: serverTimestamp() };
        await addDoc(messagesRef, newUserMessage);

        const currentMessages = activeChatId === null ? [] : messages;
        const chatHistoryForAPI = currentMessages
            .filter(msg => msg.id !== 'initial')
            .map(msg => ({
                role: msg.sender === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
        chatHistoryForAPI.push({ role: 'user', parts: [{text: userInput}]});

        try {
            const prompt = `You are an empathetic and supportive AI friend named 'Echo' for a young person. Your primary language for conversation is English. Only switch to another language like Hinglish if the user explicitly asks you to or consistently messages you in that language. Be warm, non-judgmental, and use simple, encouraging language. AVOID giving any medical or clinical advice. Focus on being a supportive listener. User said: "${input}"`;
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Your key should be handled securely
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const payload = { contents: chatHistoryForAPI };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error.message);
            }
            const result = await response.json();
            const aiText = result.candidates[0].content.parts[0].text;
            const aiResponse = { text: aiText, sender: 'ai', timestamp: serverTimestamp() };
            await addDoc(messagesRef, aiResponse);
        } catch (error) {
            console.error("Error fetching AI response:", error);
            const errorResponse = { text: "I'm having a little trouble connecting right now. Please try again.", sender: 'ai', timestamp: serverTimestamp() };
            await addDoc(messagesRef, errorResponse);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setInput('');
    };

    // --- UPDATED DELETE LOGIC ---
    const confirmDelete = async () => {
        if (!user || !chatToDelete) return;

        try {
            const messagesRef = collection(db, `artifacts/${appId}/users/${user.uid}/chats/${chatToDelete}/messages`);
            const messagesSnapshot = await getDocs(messagesRef);
            const batch = writeBatch(db);
            messagesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/chats`, chatToDelete));

            if (activeChatId === chatToDelete) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
        } finally {
            setChatToDelete(null); // Close the modal
        }
    };


    return (
        <div className="animate-fadeIn">
            <ConfirmationModal
                message={chatToDelete ? "Are you sure you want to delete this chat forever? This action cannot be undone." : null}
                onConfirm={confirmDelete}
                onCancel={() => setChatToDelete(null)}
            />

            <PageHeader title="AI Friend" onBack={() => setPage('home')} />
            <div className="flex h-[calc(100vh-150px)] w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors">
                            <PlusSquare size={18} />
                            New Chat
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                        {chatSessions.map(session => (
                            <div key={session.id} onClick={() => setActiveChatId(session.id)} className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer ${activeChatId === session.id ? 'bg-teal-100 dark:bg-teal-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                <p className="text-sm truncate text-gray-800 dark:text-gray-300">{session.title || "New Chat"}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setChatToDelete(session.id); // Open modal
                                    }}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Delete chat"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- FIX 2: Removed 'hidden' class to make chat window always visible --- */}
                <div className="flex w-full md:w-2/3 lg:w-3/4 flex-col bg-white dark:bg-gray-800">
                    <div className="flex-grow p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm flex-shrink-0 font-bold">E</div>}
                                    <div className={`max-w-xs md:max-w-xl p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-end gap-2 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm flex-shrink-0 font-bold">E</div>
                                    <div className="p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message to Echo..."
                                className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-teal-600 text-white p-3 rounded-lg hover:bg-teal-700 disabled:bg-teal-400 dark:disabled:bg-teal-800 transition-colors">
                                <Send size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



// --- Other Pages (Profile, Crisis) ---
const ProfilePage = ({ setPage }) => {
    const { user } = useContext(AuthContext);
    const [moodCount, setMoodCount] = useState(0);
    const [journalCount, setJournalCount] = useState(0);

    useEffect(() => {
        if(!user) return;
        const moodUnsub = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/mood_logs`), (snap) => setMoodCount(snap.size));
        const journalUnsub = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/journal_entries`), (snap) => setJournalCount(snap.size));
        return () => {
            moodUnsub();
            journalUnsub();
        }
    }, [user]);

    return (
        <div className="animate-fadeIn">
            <PageHeader title="My Profile" onBack={() => setPage('home')} />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm space-y-6 max-w-md mx-auto">
                <div><h3 className="font-bold text-lg font-lora">Account</h3><p className="text-gray-600 dark:text-gray-400">{user.email}</p></div>
                <div>
                    <h3 className="font-bold text-lg font-lora">My Progress</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{moodCount}</p><p className="text-sm font-medium text-blue-800 dark:text-blue-200">Moods Checked</p></div>
                        <div className="bg-purple-100 dark:bg-purple-900/50 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-purple-600 dark:text-purple-300">{journalCount}</p><p className="text-sm font-medium text-purple-800 dark:text-purple-200">Journals Written</p></div>
                    </div>
                </div>
                <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 py-3 font-bold text-red-600 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors"><LogOut size={20} /><span>Logout</span></button>
            </div>
        </div>
    );
};

const CrisisSupportPage = ({ setPage }) => (
    <div className="animate-fadeIn">
        <PageHeader title="Crisis Support" onBack={() => setPage('home')} />
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-2 border-red-500">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 font-lora">You are not alone. Help is available.</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">If you are in immediate danger, please call your local emergency number. For other urgent situations, please contact one of the resources below.</p>
            <div className="space-y-4">
                <CrisisResource name="Jeevan Aastha helpline (GJ)" number="1800-233-3330" description="24x7" />
                <CrisisResource name="Aasra" number="09820466726" description="24x7" />
                <CrisisResource name="Vandravela foundation" number="+91 9999666555" description="24x7" />
                <CrisisResource name="Kiran mental health (govt)" number="1800-599-0019" description="24x7" />
                <CrisisResource name="One life foundation" number="7893078930" description="24x7" />
                <CrisisResource name="Sumaitri" number="011-46018404" description="2pm-10pm" />
                <CrisisResource name="Fortis stress helpline" number="+91-8376804102" description="24x7" />
                <CrisisResource name="I-CALL Psychosocial helpline (Tiss)" number="022-25521111" description="10am - 8pm" />
                <CrisisResource name="Interventional bipolar foundation" number="+91-8888817666" description="7am - 9pm" />
                <CrisisResource name="National institute of behavioural sciences Kolkata" number="033-22865203" description="12pm - 8pm" />
                <CrisisResource name="CAN- Helper" number="09511948920" description="10am - 6pm" />
                <CrisisResource name="Mann talks helpline (MH)" number="8686139139" description="9am - 6pm" />
                <CrisisResource name="The institute of mental health(IMH)" number="9154154092 / 044-26425585" description="24x7" />
                <CrisisResource name="NIMHANS centre for well-being" number="08026685948 / 9480829670" description="Mon-Sat, 9am-4:30pm" />
            </div>
        </div>
    </div>
);

const CrisisResource = ({ name, number, description }) => (
    <div className="border border-red-200 dark:border-red-500/50 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        <h3 className="font-bold text-lg text-red-700 dark:text-red-300 font-lora">{name}</h3>
        <p className="text-2xl font-mono font-bold my-2 text-red-600 dark:text-red-400">{number}</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
);
