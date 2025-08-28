"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import {VerticalCutReveal} from "@/components/ui/vertical-cut-reveal";
import { useRef } from "react";

export default function PricingSection3() {
  const pricingRef = useRef<HTMLDivElement>(null);
  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const basicFeatures = [
    "Access of any 3 apps",
    "Up to 10 artboards",
    "Up to 5 fonts and graphics",
    "Call forwarding",
  ];

  const professionalFeatures = [
    "Access of any 10 apps",
    "Up to 30 artboards",
    "Up to 100 fonts and graphics",
    "Call forwarding and scheduling",
    "15 TB cloud storage",
  ];

  const enterpriseFeatures = [
    "Access of all apps",
    "Unlimited artboards",
    "Unlimited fonts and graphics",
    "Call forwarding and scheduling",
  ];

  return (
    <section
      className="py-16 px-4 bg-white w-full relative min-h-screen"
      ref={pricingRef}
    >
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#0000001a_1px,transparent_1px),linear-gradient(to_bottom,#0000001a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_40%_50%_at_50%_50%,#000_70%,transparent_110%)]"></div>
      <div className="max-w-6xl mx-auto">
        <article className="text-center mb-12">
          <h2 className="text-4xl font-semibold text-gray-900 mb-4">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.15}
              staggerFrom="first"
              reverse={true}
              containerClassName="justify-center"
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 40,
                delay: 0, // First element
              }}
            >
              Start 14 Days Free-Trial
            </VerticalCutReveal>
          </h2>

          <TimelineContent
            as="p"
            animationNum={0}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="text-gray-600"
          >
            Get started today, no credit card required
          </TimelineContent>
        </article>

        <div className="grid md:grid-cols-3 md:gap-8 gap-3 items-end">
          {/* Basic Plan */}
          <TimelineContent
            as="div"
            animationNum={1}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card className="bg-white p-0 h-fit border-neutral-200">
              <CardHeader className="text-left py-4 border-b bg-gray-100 border-neutral-300 rounded-xl">
                <h3 className="text-xl text-gray-900 mb-4">Basic</h3>
                <div className="flex justify-start items-end">
                  <span className="text-4xl font-semibold text-gray-900">
                    $16
                  </span>
                  <span className="text-gray-600">/user</span>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <ul className="space-y-3 mb-6">
                  {basicFeatures.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full p-3 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600 text-white hover:bg-indigo-700">
                  Choose Basic
                </button>
              </CardContent>
            </Card>
          </TimelineContent>

          {/* Professional Plan */}
          <TimelineContent
            as="div"
            animationNum={2}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card className="bg-indigo-700 p-0 rounded-lg shadow-lg relative h-fit border-neutral-200">
              <CardHeader className="pb-6 bg-indigo-600 rounded-t-lg py-6">
                <div className="flex gap-2 justify-between">
                  <h3 className="text-xl text-white mb-4">Professional</h3>
                  <span className="text-white/60 px-2 py-1 text-xs">
                    Popular
                  </span>
                </div>
                <div className="w-full justify-start flex items-end">
                  <span className="text-4xl font-semibold text-white">$24</span>
                  <span className="text-purple-100">/month</span>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <ul className="space-y-3 mb-6">
                  {professionalFeatures.map((feature, index) => (
                    <li key={index} className="text-sm text-white">
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full p-3 border border-gray-800 shadow-lg shadow-black font-semibold  rounded-xl bg-black text-white hover:bg-gray-800">
                  Choose Professional
                </button>
              </CardContent>
            </Card>
          </TimelineContent>

          {/* Enterprise Plan */}
          <TimelineContent
            as="div"
            animationNum={3}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card className="bg-white p-0 border-neutral-200">
              <CardHeader className="text-left py-4 border-b bg-gray-100 rounded-xl border-neutral-300">
                <h3 className="text-xl text-gray-900 mb-4">Enterprise</h3>
                <div className="flex justify-start items-end">
                  <span className="text-4xl font-semibold text-gray-900">
                    $40
                  </span>
                  <span className="text-gray-600">/user</span>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <ul className="space-y-3 mb-6">
                  {enterpriseFeatures.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full p-3 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600 text-white hover:bg-indigo-700">
                  Choose Enterprise
                </button>
              </CardContent>
            </Card>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}