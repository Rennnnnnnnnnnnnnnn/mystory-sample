import { useNavigate } from "react-router-dom";
import useScrollRestoration from "../hooks/useScrollRestoration";
import FadeInSlide from "../layout/FadeInOnScroll";

const AboutPage = () => {
    const navigate = useNavigate();
    useScrollRestoration("about", true);

    return (
        <div className="bg-gray-100 text-gray-800 min-h-screen font-sans dark:bg-gray-900 overflow-x-hidden">
            {/* Hero Section */}
            <section className="pt-24 pb-16 md:py-30 px-6 text-center dark:from-gray-900">
                <FadeInSlide direction="down">
                    <h1 className="text-3xl md:text-5xl font-semibold mb-6 mt-10 md:mt-20 text-gray-900 dark:text-white">
                        Everyone has a story
                    </h1>
                </FadeInSlide>

            </section>
            {/* Main Story Section */}
            <section className="py-16 px-6 md:px-24 max-w-5xl mx-auto bg-stone-200 dark:bg-gray-800 rounded-2xl shadow-sm">
                <FadeInSlide direction="left">
                    <p className="text-gray-700 dark:text-gray-300">
                        Some stories are loud and life-changing.</p>
                </FadeInSlide>
                <FadeInSlide direction="left">
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        Others are quiet and exist only in silence.</p>
                </FadeInSlide>

                <FadeInSlide direction="left">
                    <p className="mb-2 font-semibold text-gray-900 dark:text-white">
                        It could be stories that shaped you growing up.
                    </p>
                </FadeInSlide>

                <div className="pl-6 mb-4 md:pl-10 space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <FadeInSlide direction="left"><p>Maybe it's the moment you met the love of your life… a spark that still makes your heart skip a beat.</p></FadeInSlide>
                    <FadeInSlide direction="left"><p>Maybe it's the time someone unexpectedly showed a random act of kindness… a gesture that touches your soul.</p></FadeInSlide>
                    <FadeInSlide direction="left"><p>Maybe it's an incident so funny… one that never fails to bring a smile.</p></FadeInSlide>
                    <FadeInSlide direction="left"><p>Maybe it's the loneliness you feel late at night… a quiet sorrow no one else sees.</p></FadeInSlide>
                    <FadeInSlide direction="left"><p>Maybe it's your "<i>Multo</i>", your regrets, your what-ifs… a memory that still haunts you.</p></FadeInSlide>
                    <FadeInSlide direction="left"><p>Maybe it's the frustrations you never say out loud… a hidden burden you swallow to avoid conflict.</p></FadeInSlide>
                    <FadeInSlide direction="left"><p>Maybe it's the unexplained anomalies you've witnessed… the things that never truly made sense.</p></FadeInSlide>
                </div>

                <FadeInSlide direction="left">
                    <p className="mb-4 font-medium text-gray-900 dark:text-white">
                        Or it could be a simple story about what happened today.
                    </p>
                </FadeInSlide>



                <FadeInSlide direction="left">
                    <p className="mb-2 text-gray-700 dark:text-gray-300">
                        Whatever it may be, you have something.  You have a story to tell.
                    </p>
                </FadeInSlide>

                <FadeInSlide direction="left">
                    <p className="mb-2 text-gray-700 dark:text-gray-300">

                    </p>
                </FadeInSlide>

                <FadeInSlide direction="left">
                    <p className="mb-2 text-gray-700 dark:text-gray-300">
                        These stories with all the joys, the sorrows, and the lessons between them.
                    </p>
                </FadeInSlide>

                <FadeInSlide direction="left">
                    <p className="mb-2 text-gray-700 dark:text-gray-300">
                        It deserves to be heard and this is where it begins.
                    </p>
                </FadeInSlide>

                <FadeInSlide direction="left">
                    <p className="mb-2 text-gray-700 dark:text-gray-300">

                    </p>
                </FadeInSlide>
            </section>

            {/* Philosophy */}
            <section className="py-16 px-6 md:px-24 max-w-5xl mx-auto text-center">
                <FadeInSlide direction="up">
                    <h2 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-blue-300">
                        Our Philosophy
                    </h2>
                </FadeInSlide>
                <div className="text-gray-700 dark:text-gray-300 text-lg">
                    <FadeInSlide direction="left">
                        <p>It doesn’t have to be big to be important.</p>
                    </FadeInSlide>

                    <FadeInSlide direction="left">
                        <p>
                            It doesn’t have to be dramatic to matter.
                        </p>
                    </FadeInSlide>

                    <FadeInSlide direction="left" className="mb-4">
                        <p>It just needs to be real.</p>
                    </FadeInSlide>
                </div>
            </section>
            {/* The Problem */}
            <section className="py-16 px-6 md:px-24 max-w-5xl mx-auto bg-stone-200 dark:bg-gray-800 rounded-2xl shadow-sm">
                <FadeInSlide direction="up">
                    <h2 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-white">
                        The Challenge
                    </h2>
                </FadeInSlide>
                <div className="border-r-4 border-blue-800 dark:border-blue-300 md:pr-30 pr-6 pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                    <FadeInSlide direction="right">
                        <p>
                            In the digital world driven by virality, inauthenticity, and toxicity, genuine personal stories go unnoticed.
                        </p>
                    </FadeInSlide>

                    <FadeInSlide direction="right">
                        <p>
                            — and the ones that do get seen are met with judgment and cruelty.
                        </p>
                    </FadeInSlide>
                </div>
            </section>

            {/* Why MyStory Exists */}
            <section className="py-16 px-6 md:px-24 max-w-5xl mx-auto dark:bg-gray-900 rounded-2xl
">
                <FadeInSlide direction="up">
                    <h2 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-white">
                        Why MyStory Exists
                    </h2>
                </FadeInSlide>

                <div className="border-l-4 border-blue-800 dark:border-blue-300 pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                    {/* <FadeInSlide direction="left">
                        <p> In the digital world dominated by metrics, trolls, meme, and constant commentary, the quiet truth of personal stories is often lost.
                         In the digital world dominated by virality, inauthenticity, and toxicity the quiet truth of personal stories is often lost.
                        </p>
                    </FadeInSlide> */}

                    <FadeInSlide direction="left">
                        <p>MyStory is a space to let those stories be heard
                        </p>
                    </FadeInSlide>

                    <FadeInSlide direction="left">
                        <p>
                            — without judgement, without criticism, without fear.
                        </p>
                    </FadeInSlide>

                    <FadeInSlide direction="left">
                        <p>A place to express, to reflect, and to remember.</p>
                    </FadeInSlide>
                </div>
            </section>

            {/* This Is Not A Social Network */}
            <section className="py-16 px-6 md:px-24 max-w-5xl mx-auto bg-stone-200 dark:bg-gray-800 rounded-2xl shadow-sm">
                <FadeInSlide direction="up">
                    <h2 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-white">
                        Beyond Social Media
                    </h2>
                </FadeInSlide>

                <div className="border-r-4 border-blue-800 dark:border-blue-300 pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                    <FadeInSlide direction="right">
                        <p>Stories don’t perform here. They simply exist.</p>
                    </FadeInSlide>

                    <FadeInSlide direction="right">
                        <p>No profiles competing for attention.</p>
                    </FadeInSlide>

                    <FadeInSlide direction="right">
                        <p>No follower counts defining value.</p>
                    </FadeInSlide>
                </div>
            </section>

            <section className="py-16 px-6 md:px-24 max-w-5xl mx-auto dark:bg-gray-900 rounded-2xl">
                <FadeInSlide direction="up">
                    <h2 className="text-3xl font-semibold mb-8 text-gray-900  dark:text-white">
                        How It Works
                    </h2>
                </FadeInSlide>

                <div className="flex flex-col w-full md:gap-8 md:space-y-0 space-y-6">
                    {/* Pair 1 */}
                    <div className="flex flex-col md:flex-row w-full md:space-x-4 gap-6 md:gap-2 items-stretch">
                        <FadeInSlide direction="right" className="flex-1">
                            <div className="h-full w-full p-6 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-black dark:border-gray-500 flex flex-col">
                                <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">
                                    Private & Public Stories
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Keep your thoughts private or share them with the world — the choice is yours.
                                </p>
                            </div>
                        </FadeInSlide>

                        <FadeInSlide direction="right" className="flex-1">
                            <div className="h-full w-full p-6 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-black dark:border-gray-500 flex flex-col">
                                <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">
                                    Anonymous Feed
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Explore a feed of stories without names or profiles.
                                    {/* It’s about the story being heard without the storyteller being known. */}
                                </p>
                            </div>
                        </FadeInSlide>
                    </div>
                    {/* Pair 2 */}
                    <div className="flex flex-col md:flex-row w-full md:space-x-4 gap-6 md:gap-2 items-stretch">
                        <FadeInSlide direction="right" className="flex-1">
                            <div className="h-full w-full p-6 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-black dark:border-gray-500 flex flex-col">
                                <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">
                                    Emotional Discovery
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Filter stories by how they make you feel — wholesome, sad, funny, scary, and more.
                                </p>
                            </div>
                        </FadeInSlide>

                        <FadeInSlide direction="right" className="flex-1">
                            <div className="h-full w-full p-6 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-black dark:border-gray-500 flex flex-col">
                                <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">
                                    Set Your Boundaries
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Decide if your story invites conversation or simply exists to be heard.
                                </p>
                            </div>
                        </FadeInSlide>


                    </div>
                    {/* Pair 2 */}
                    <div className="flex flex-col md:flex-row w-full md:space-x-4 gap-6 md:gap-2 items-stretch">
                        <FadeInSlide direction="right" className="flex-1">
                            <div className="h-full w-full p-6 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-black dark:border-gray-500 flex flex-col">
                                <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">
                                    Interact Gently
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Like a story, save it for later, share it with others, or leave a quiet thought.
                                </p>
                            </div>
                        </FadeInSlide>

                        <FadeInSlide direction="right" className="flex-1">
                            <div className="h-full w-full p-6 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-black dark:border-gray-500 flex flex-col">
                                <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">
                                    Safety & Respect
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Report stories that feel inappropriate to keep the space safe for everyone.
                                </p>
                            </div>
                        </FadeInSlide>
                    </div>
                </div>
            </section>

            {/* EXTRA */}
            <section className="py-16 px-6 md:px-24 max-w-5xl mx-auto text-center bg-stone-200 dark:bg-gray-800 rounded-2xl shadow-sm">
                <div className="font-semibold text-lg text-black dark:text-white">
                    <FadeInSlide direction="left"><p>Share Yours. Discover Others.</p></FadeInSlide>
                    <FadeInSlide direction="left"><p>And let the stories connect.</p></FadeInSlide>
                </div>
            </section>

            {/* CTA */}
            <section className="pt-12 pb-20 px-6 text-center dark:bg-gray-900">
                <FadeInSlide direction="up">
                    <h1 onClick={() => navigate("/")}
                        className="text-2xl md:text-3xl font-semibold 
                    text-black dark:text-white 
                    hover:text-blue-800 dark:hover:text-blue-300 
                    transition underline underline-offset-16 hover:cursor-pointer">
                        So what’s your story?
                    </h1>
                </FadeInSlide>
            </section>
        </div>
    );
};

export default AboutPage;