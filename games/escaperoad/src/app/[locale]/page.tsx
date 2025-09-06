import {getSEOTags} from "@/lib/seo"
import Script from 'next/script'
import FullscreenIframe from "./FullscreenIframe";
import {getTranslations} from "next-intl/server";
import { Car, Map, Zap, Gamepad2, Music, Star, ChevronRight } from 'lucide-react';

export const runtime = "edge";

export const generateMetadata = async () => {
    const t = await getTranslations('home.Metadata');
    return await getSEOTags({
        title: t('title'),
        path: "/",
        description: t('description'),
        keywords: t('keywords'),
    })
}

export default async function Home() {
    const t = await getTranslations('home');

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-16 text-gray-300">
            <Script
                id="escape-road-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "VideoGame",
                        "name": "Escape Road",
                        "description": t('introduction.content'),
                        "genre": ["驾驶游戏", "动作游戏", "冒险游戏"],
                        "playMode": "SinglePlayer",
                        "applicationCategory": "Browser Game",
                    })
                }}
            />

            <section id="hero" className="text-center bg-gradient-to-r from-blue-600 to-purple-600 p-10 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold mb-4 text-white">{t('hero.title')}</h1>
                <p className="mb-6 text-gray-200">{t('hero.subtitle')}</p>
                <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-full inline-flex items-center transition duration-300">
                    {t('hero.startButton')}
                    <ChevronRight className="ml-2" />
                </button>
            </section>

            <section id="play" className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Gamepad2 className="mr-2" /> {t('play.title')}
                </h2>
                <p className="mb-6">
                    {t('play.description')}
                </p>
            </section>

            <section id="introduction" className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Zap className="mr-2" /> {t('introduction.title')}
                </h2>
                <p className="mb-4 text-lg leading-relaxed">
                    {t('introduction.content')}
                </p>
            </section>

            <section id="features" className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <Star className="mr-2" /> {t('features.title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(t.raw('features.items') as Array<{ title: string; description: string }>).map((item, index) => (
                        <div key={index} className="flex items-start">
                            {index === 0 && <Map className="mr-3 flex-shrink-0" />}
                            {index === 1 && <Car className="mr-3 flex-shrink-0" />}
                            {index === 2 && <Zap className="mr-3 flex-shrink-0" />}
                            {index === 3 && <Gamepad2 className="mr-3 flex-shrink-0" />}
                            {index === 4 && <Music className="mr-3 flex-shrink-0" />}
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="how-to-play" className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Gamepad2 className="mr-2" /> {t('howToPlay.title')}
                </h2>
                <p className="mb-4 text-lg">
                    {t('howToPlay.description')}
                </p>
                <h3 className="text-2xl font-semibold mb-2">{t('howToPlay.controls.title')}</h3>
                <ul className="list-disc pl-6 space-y-2 text-lg">
                    {t.raw('howToPlay.controls.items').map((item:string, index:number) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </section>

            <section id="player-reviews" className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <Star className="mr-2" /> {t('playerReviews.title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(t.raw('playerReviews.reviews') as Array<{ content: string; author?: string }>).map((review, index) => (
                        <blockquote key={index} className="bg-gray-700 p-4 rounded-lg italic">
                            &ldquo;{review.content}&rdquo;
                            <footer className="mt-2 text-right">- {review.author}</footer>
                        </blockquote>
                    ))}
                </div>
            </section>

            <footer className="text-center mt-8 text-gray-500">
                <p>{t('footer.copyright')}</p>
            </footer>
        </div>
    );
}
