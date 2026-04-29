export interface BlogPost {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  excerpt: string;
  content: string;
  readTime: string;
  category: string;
  emoji: string;
  color: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "dale-carnegie",
    title: "How to Win Friends and Influence People Through Speaking",
    author: "Dale Carnegie",
    authorRole: "Author & Leadership Trainer",
    excerpt:
      "Carnegie's timeless principles on human relations and the art of speaking to inspire, convince, and connect with people in any room.",
    content: `Dale Carnegie revolutionized the way the world thinks about communication. His core philosophy was simple: people are not primarily creatures of logic — they are creatures of emotion. When you speak, you must first connect emotionally before you can persuade intellectually.

**Lesson 1: Become Genuinely Interested in Other People**
The first and most powerful speaking skill is listening. Before you try to speak, listen. Ask questions and mean them. When people feel heard, they open up — and then they're ready to hear you.

**Lesson 2: Remember That a Person's Name Is the Sweetest Sound**
In a GD or interview, using the interviewer's or panelist's name creates instant rapport. Practice remembering and using names naturally.

**Lesson 3: Let the Other Person Feel the Idea Is Theirs**
Great communicators don't force their ideas — they plant seeds. Frame your thoughts as questions or suggestions, and let others build on them.

**Lesson 4: Begin With Praise and Honest Appreciation**
Start every response by acknowledging what's already been said well. This shows maturity and active listening.

**Carnegie's Rule for Public Speaking:**
"The royal road to a man's heart is to talk to him about the things he treasures most." Know your audience. Study them before you speak to them.

*Practice Exercise:* In your next practice session, try to include the name of your imaginary interviewer at least twice in your responses. Notice how it changes the energy of the conversation.`,
    readTime: "5 min read",
    category: "Communication",
    emoji: "🤝",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "simon-sinek",
    title: "Start With Why: The Secret of Inspiring Speakers",
    author: "Simon Sinek",
    authorRole: "Author, Motivational Speaker",
    excerpt:
      "Why do some speakers leave you energized while others leave you unmoved? Simon Sinek's Golden Circle reveals the answer — and how you can apply it.",
    content: `Simon Sinek's discovery of the Golden Circle changed how leaders, entrepreneurs, and speakers worldwide think about communication.

**The Golden Circle**
Most people communicate from the outside in: What → How → Why.
The best communicators — and the most inspiring ones — work from the inside out: Why → How → What.

**Applying It to Interviews**
When asked "Tell me about yourself," most people say:
- "I am a software engineer..." (What)
- "I build scalable systems..." (How)

Instead, try:
- "I believe that technology should make life simpler for everyone. That belief drives me to build clean, user-friendly systems. Today, I do that as a software engineer at..."

See the difference? You led with your *why* — your belief, your purpose.

**For Group Discussions**
Before contributing to a GD, ask yourself: *Why am I making this point? What do I truly believe here?*
When you speak from conviction, your words carry natural authority. People don't follow data — they follow belief.

**Voice and Body Language**
Sinek also emphasizes that HOW you say something matters as much as WHAT you say. Slow down. Use pauses. Let important points breathe.

*Practice Exercise:* Rewrite your "Tell me about yourself" answer starting with "I believe..." and notice how it feels more authentic.`,
    readTime: "6 min read",
    category: "Leadership",
    emoji: "💡",
    color: "from-orange-500 to-red-600",
  },
  {
    id: "winston-churchill",
    title: "The Art of Oratory: Lessons From Churchill's Greatest Speeches",
    author: "Winston Churchill",
    authorRole: "British Prime Minister & Orator",
    excerpt:
      "Churchill didn't start as a natural speaker — he practiced obsessively. Discover his techniques for crafting words that move nations.",
    content: `Winston Churchill is widely regarded as one of the greatest orators in history. His 1940 speeches during World War II are studied to this day. But what most people don't know is that Churchill was not a natural speaker — he had a speech impediment (a lisp) and intense stage fright.

**Churchill's Rule #1: Prepare, Then Prepare Some More**
Churchill spent up to one hour preparing for every minute of a major speech. For a 30-minute speech, he spent 30 hours preparing. He wrote out every word, practiced in front of mirrors, and rehearsed walking, pausing, and gesturing.

**Churchill's Rule #2: Short Words Are Best**
"Short words are best, and old words when short are best of all." Avoid jargon. Speak simply. The biggest ideas are always expressed in simple language.

**Churchill's Rule #3: Use Rhythm and Repetition**
"We shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields... we shall never surrender."
The repetition creates rhythm that makes words unforgettable. In presentations, repeat your key message 3 times — at the beginning, middle, and end.

**Churchill's Rule #4: The Power of the Pause**
Churchill used deliberate pauses to create drama and let his words sink in. In your next interview or GD, practice pausing for 2 seconds after making an important point.

**Churchill's Journey**
He overcame his stutter through sheer force of will and practice. Every day, he read poetry aloud to develop cadence and timing.

*Practice Exercise:* Record yourself reading the following aloud: "The price of greatness is responsibility." Replay it, and note where you naturally pause. Those pauses are your power moments.`,
    readTime: "7 min read",
    category: "Oratory",
    emoji: "🎙️",
    color: "from-slate-600 to-gray-800",
  },
  {
    id: "shiv-khera",
    title: "Winners Don't Do Different Things, They Do Things Differently",
    author: "Shiv Khera",
    authorRole: "Author of 'You Can Win'",
    excerpt:
      "India's most beloved motivational speaker shares practical wisdom on attitude, confidence, and communicating like a leader.",
    content: `Shiv Khera's "You Can Win" has sold over 3.5 million copies globally and has transformed the way millions of Indians think about success. His insights on communication are particularly powerful for job seekers and students.

**On Building Confidence Before You Speak**
"Your attitude determines your altitude." Khera believes that confidence is not given — it's built. Every practice session you do is depositing confidence into your personal bank.

**The Winning Attitude in Communication**
Winners communicate differently:
- They speak with clarity, not confusion
- They listen with intent, not just to respond
- They disagree respectfully, not aggressively
- They take responsibility, not excuses

**On English and Language Barriers**
Khera himself grew up in an environment where English was not the first language. His advice to non-native speakers: "Don't apologize for your accent. Own it. Your accent is your identity — your words are what matter."

**The 3Cs of Effective Communication**
1. **Clarity** — Say what you mean, mean what you say
2. **Conviction** — Believe in what you're saying
3. **Conciseness** — Respect the listener's time

**On Facing the Fear of Public Speaking**
"Fear is not real. It is a product of your thoughts. You are in danger of losing something you've never had — respect. But you gain respect by doing the very thing you fear."

*Practice Exercise:* Before each practice session, look in the mirror and say: "I speak with confidence, clarity, and conviction." Repeat 3 times. It sounds simple — Khera says it works.`,
    readTime: "6 min read",
    category: "Motivation",
    emoji: "🏆",
    color: "from-yellow-500 to-orange-600",
  },
  {
    id: "martin-luther-king",
    title: "The Dream of Speaking: MLK's Techniques for Moving an Audience",
    author: "Dr. Martin Luther King Jr.",
    authorRole: "Civil Rights Leader & Orator",
    excerpt:
      "Analyze the rhetorical brilliance behind 'I Have a Dream' and learn how to infuse your own speaking with emotional power and conviction.",
    content: `The "I Have a Dream" speech, delivered on August 28, 1963, is considered one of the greatest speeches in human history. Dr. King's brilliance wasn't accidental — it was the product of years of preaching, studying rhetoric, and understanding human emotion.

**Technique 1: Anaphora (Repetition for Power)**
"I have a dream that... I have a dream that... I have a dream that..."
Repetition of a phrase at the beginning of sentences creates a hypnotic rhythm. In your presentations, repeat your central idea in different forms throughout.

**Technique 2: Metaphor and Imagery**
King said: "America has given the Negro people a bad check, a check which has come back marked 'insufficient funds.'"
He didn't use dry statistics — he used a metaphor everyone could relate to. Make your ideas tangible through comparison.

**Technique 3: Building to a Crescendo**
The speech builds in energy throughout. Soft and factual at the start, passionate and visionary at the end. Structure your answers in interviews this way — begin with context, build with evidence, close with vision.

**Technique 4: The Power of the Voice**
King varied his:
- **Pitch** — from low and serious to high and triumphant
- **Pace** — slow during key moments, faster during lists
- **Volume** — quiet to create intimacy, loud to inspire

**The Lesson for English Speakers**
You don't need to be born with a "good voice." You need to learn how to use the voice you have. Record yourself. Play it back. Identify monotone sections. Then re-record with more variation.

*Practice Exercise:* Read this sentence aloud 3 times — each time with a different emotion (sad, confident, inspiring): "Today is the beginning of something great."`,
    readTime: "8 min read",
    category: "Oratory",
    emoji: "✊",
    color: "from-purple-600 to-indigo-700",
  },
  {
    id: "brene-brown",
    title: "The Power of Vulnerability in Authentic Communication",
    author: "Brené Brown",
    authorRole: "Research Professor & Author",
    excerpt:
      "Brown's groundbreaking research reveals why showing vulnerability makes you a stronger, more trustworthy communicator.",
    content: `Brené Brown's TED Talk on vulnerability has been viewed over 60 million times. Her research at the University of Houston found something counterintuitive: the speakers who connected most deeply with audiences were those who showed vulnerability.

**What Vulnerability in Speaking Looks Like**
It doesn't mean crying on stage. It means:
- Admitting when you don't know something: "That's a great question — I'd need to think more about that."
- Sharing a real failure in your story: "I struggled with this at first, but here's what I learned..."
- Showing genuine enthusiasm or uncertainty

**Why It Builds Trust**
When you pretend to have all the answers, people sense it's a performance. When you admit limitation and still show confidence, people trust you.

**In Job Interviews**
The hardest question: "What's your weakness?"
Most people give a fake answer ("I work too hard"). Brown's research suggests authenticity works better:
"I sometimes struggle to delegate because I care deeply about quality. I'm actively working on trusting my team more, and here's how..."

**In Group Discussions**
When someone makes a better point than you, say so: "That's a perspective I hadn't considered — I think it strengthens the argument because..."
This shows maturity, active listening, and intellectual honesty.

**Brown's Core Message**
"Vulnerability is not weakness. It's our greatest measure of courage."

*Practice Exercise:* In your next practice speech, include one moment where you admit to a genuine uncertainty or challenge. Notice how it feels — and how it sounds on playback.`,
    readTime: "6 min read",
    category: "Authenticity",
    emoji: "💜",
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "shashi-tharoor",
    title: "English as a Living Language: Mastering Vocabulary and Wit",
    author: "Dr. Shashi Tharoor",
    authorRole: "Author, Politician & Public Speaker",
    excerpt:
      "India's most celebrated English orator shares his philosophy on vocabulary, wit, and why reading is the foundation of great speaking.",
    content: `Dr. Shashi Tharoor is perhaps India's most celebrated user of the English language. His viral use of words like "farrago," "loquacious," and "exasperating" sparked a national conversation about vocabulary. But behind the wit lies deep wisdom about language learning.

**On Building Vocabulary**
"I don't hunt for fancy words. I have read so much that the words come naturally." Tharoor reads 2-3 books a week. His vocabulary is the product of a lifetime of reading, not memorization.

**His Reading List for English Learners**
- P.G. Wodehouse (for comic timing and rhythm)
- Winston Churchill's war memoirs (for power and clarity)
- The Times Literary Supplement (for contemporary ideas)
- Classic novels by Dickens, Austen (for narrative structure)

**On Speaking English as an Indian**
"The English language belongs to no one country. India has as much right to it as Britain does." Tharoor believes Indian English, with its unique rhythms and inflections, is a legitimate and vibrant dialect.

**The Art of Wit**
Tharoor's speeches are often punctuated by humor. His advice: "Read widely, think deeply, and never take yourself too seriously." Wit comes from seeing connections between ideas — and that comes from breadth of knowledge.

**On Overcoming the Fear of "Wrong" English**
Many Indians fear speaking English because they fear making grammatical errors. Tharoor says: "Grammar is a tool, not a tyrant. Communicate. Connect. The rest will follow."

**His Daily Practice**
Tharoor journals in English every day — free-writing his thoughts for 20 minutes each morning. This practice, he says, keeps his mind sharp and his language fluid.

*Practice Exercise:* Read one paragraph of Wodehouse or Churchill aloud every day. Notice the rhythm. Try to speak with that same rhythm in your next practice session.`,
    readTime: "7 min read",
    category: "Vocabulary",
    emoji: "📚",
    color: "from-teal-500 to-cyan-600",
  },
  {
    id: "amy-cuddy",
    title: "Your Body Language Shapes Who You Are as a Speaker",
    author: "Amy Cuddy",
    authorRole: "Social Psychologist, Harvard Business School",
    excerpt:
      "Harvard research reveals how posture, eye contact, and body language before and during speaking can literally change your brain chemistry.",
    content: `Amy Cuddy's 2012 TED Talk "Your Body Language May Shape Who You Are" is the second most-watched TED Talk of all time. Her research has direct, powerful implications for anyone who practices public speaking or faces interviews.

**The Power Pose Finding**
Cuddy's research showed that standing in an expansive, confident posture for just 2 minutes before a high-stakes situation:
- Increases testosterone (confidence hormone) by 20%
- Decreases cortisol (stress hormone) by 25%

**Before an Interview or GD**
Go to a private space 2 minutes before. Stand with feet shoulder-width apart, hands on hips or raised in a V. Breathe deeply. You are literally preparing your brain for confidence.

**Eye Contact Rules**
- **1:1 conversations:** 60–70% eye contact
- **Panels/GDs:** Make eye contact with each person for 3–5 seconds before moving on
- **Never:** Look down while making an important point

**Open Body Language Signals**
- Arms uncrossed
- Leaning slightly forward
- Nodding while listening
- Feet pointed toward the speaker (shows engagement)

**Voice and Body Alignment**
Cuddy found that voice trembles when the body is contracted. When you expand your posture, your voice naturally deepens and steadies.

**Fake It Till You Become It**
Cuddy's most controversial — and now validated — finding: acting confident changes how you feel about yourself. The behavior comes first; the belief follows.

*Practice Exercise:* Before each VANI practice session, do a 2-minute power pose. Track how your voice sounds on playback compared to sessions where you didn't do this.`,
    readTime: "6 min read",
    category: "Body Language",
    emoji: "💪",
    color: "from-emerald-500 to-green-600",
  },
];
