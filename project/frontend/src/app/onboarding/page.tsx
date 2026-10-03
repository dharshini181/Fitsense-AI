"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

const styleOptions = [
  {
    id: "minimalist",
    title: "Minimalist",
    description: "Clean lines, structural elegance",
    image:
      "https://images.unsplash.com/photo-1627130697816-4d71dbfe6a5b?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "streetwear",
    title: "Streetwear",
    description: "Urban comfort, bold expression",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3uBgyXUpRGUO5wsvHUSvvMAgCbh2xqHcbtyX2-KFg8wAiuzaqPutYMycmIRjOgZ0yRHX7bSR5qfKqcxxlpzioiExgkEcS5-yP4wJu8MHdzovUJ-N5whmyUBjjYKrEPLsH59-h8jXTfzhj4uOXJzUYflWcu0qL7YDaav_E6fRBa5134H8CWiFtY043zdc5VlV_zd9FUfHQC60XycMATMpwSsdoyWovohs-7SsspnnrUQPbRieZhQhU",
  },
  {
    id: "luxury",
    title: "Quiet Luxury",
    description: "Refined materials, timeless taste",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBE9pFaew-lBgsA-952aJgsbU0nbW_cDBxJhwoeX-zIOVzzRgBN2SIUJ6AirlGIphpamlzWJwPG7phxvwkEuCCyykDzkOsYoMuVIuQwqdWZCP3KT_P_z_M8BApQ7STYmjhN6uHN0xKKXsVTTkyqpLA5s6Jk8N6vfxihjmP_Cb4cPTaJNX7PbpiPRrAtiq-o4MA8OIuKL6Z9dB8hzl5VIrGbbFRBAoNyEHD9I-2rYs2c_HYGQtDbIXf2",
  },
  {
    id: "bohemian",
    title: "Modern Bohemian",
    description: "Flowing textures, warm tones",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtjTCb538ivfLsVxKVcz8B7aTkXZqN2zswg6h_W2rBY3kDQR1QIuAnRdWN8NeL65l6YaqAJF1Nc1qQBFY0M-ndblsyPDTPvfYUKsAVXyR4s1fGwytWD4Ov_iuH1np4AaSgG2NIPYPcXgWAAqvVNiCjNsq5F3YlcYTAWCX4HwErbz8EuZ0wbXBUxIYg2GLkIMz1-bPLpsF-r58iKUByIgNkICf02KrL-luLpNdBB5HozfuyRGZqUSti",
  },
];

function StyleCard({
  title,
  description,
  image,
  selected,
  onToggle,
}: {
  title: string;
  description: string;
  image: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`style-card group relative aspect-[4/5] rounded-[24px] overflow-hidden soft-shadow text-left focus:outline-none ${
        selected ? "ring-2 ring-primary-container" : ""
      }`}
    >
      <img
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        src={image}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="glass-panel rounded-xl p-4 flex justify-between items-end backdrop-blur-md">
          <div>
            <h3 className="text-headline-lg-mobile font-bold text-on-surface mb-1">
              {title}
            </h3>
            <p className="text-body-md text-on-surface-variant">{description}</p>
          </div>
          <div
            className={`w-8 h-8 rounded-full bg-primary-container flex items-center justify-center transition-opacity duration-300 ${
              selected ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-on-primary-container">
              <Check className="w-[18px] h-[18px]" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  const toggleStyle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <header className="w-full flex items-center justify-between px-container-padding-mobile md:px-container-padding-desktop h-20 bg-surface/40 backdrop-blur-xl fixed top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-primary">
            <Sparkles className="w-6 h-6" />
          </span>
          <span className="text-headline-lg-mobile md:text-headline-lg font-bold tracking-tight">
            FitSense AI
          </span>
        </Link>
        <Link
          href="/auth?mode=signup"
          className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
        >
          Skip
        </Link>
      </header>

      <main className="flex-grow pt-24 pb-32 px-container-padding-mobile md:px-container-padding-desktop flex flex-col max-w-7xl mx-auto w-full">
        <div className="w-full max-w-md mx-auto mb-stack-lg">
          <div className="flex justify-between text-caption font-medium text-on-surface-variant mb-unit">
            <span>Step 2 of 4</span>
            <span>Style Preferences</span>
          </div>
          <div className="h-2 bg-[#ECECD8] rounded-full overflow-hidden">
            <div className="h-full bg-primary-container rounded-full w-1/2 transition-all duration-500" />
          </div>
        </div>

        <div className="text-center mb-section-gap">
          <h1 className="text-display-lg font-bold text-on-surface mb-stack-sm">
            Define Your Aesthetic
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Select the styles that resonate with your personal vision. FitSense AI
            will tailor recommendations to match your unique vibe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-section-gap">
          {styleOptions.map((style) => (
            <StyleCard
              key={style.id}
              title={style.title}
              description={style.description}
              image={style.image}
              selected={selected.includes(style.id)}
              onToggle={() => toggleStyle(style.id)}
            />
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-surface-variant/30 p-4 md:p-6 z-40 soft-shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <Link
            href="/"
            className="text-button font-semibold px-6 py-4 rounded-[16px] border-[1.5px] border-on-surface text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            type="button"
            onClick={() => {
              // Carry the chosen styles forward to the (currently
              // nonexistent-until-now) signup form — onboarding happens
              // before an account exists, so this can't be saved to a
              // profile yet. The signup page reads and applies it after
              // the account is actually created.
              const titles = styleOptions
                .filter((s) => selected.includes(s.id))
                .map((s) => s.title);
              if (titles.length > 0) {
                sessionStorage.setItem("fitsense_onboarding_styles", JSON.stringify(titles));
              }
              router.push("/auth?mode=signup");
            }}
            className="text-button font-semibold px-8 py-4 rounded-[16px] bg-primary-container text-on-surface hover:opacity-90 transition-colors flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}