'use client'

import { cn } from '@/lib/utils'
import { Palette, Sparkles, Share2, LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

export function Features() {
    return (
        <section className="bg-neutral-950 py-16 md:py-32">
            <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
                <div className="mx-auto grid gap-4 lg:grid-cols-2">
                    <FeatureCard>
                        <div className="p-6 pb-3">
                            <CardHeading
                                icon={Palette}
                                title="3D Venue Design"
                                description="Visualize your dream wedding in stunning 3D before the big day."
                            />
                        </div>

                        <div className="relative mb-6 border-t border-neutral-800 border-dashed sm:mb-0">
                            <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(38,38,38,0.8),black_125%)]"></div>
                            <div className="aspect-[76/59] p-1 px-6">
                                <img
                                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80"
                                    className="w-full h-full object-cover rounded-lg opacity-80"
                                    alt="Wedding venue visualization"
                                    width={1207}
                                    height={929}
                                />
                            </div>
                        </div>
                    </FeatureCard>

                    <FeatureCard>
                        <div className="p-6 pb-3">
                            <CardHeading
                                icon={Sparkles}
                                title="AI-Powered Suggestions"
                                description="Get intelligent design recommendations tailored to your style."
                            />
                        </div>

                        <div className="p-6 pt-0">
                            <div className="relative mb-6 sm:mb-0">
                                <div className="absolute -inset-6 [background:radial-gradient(50%_50%_at_75%_50%,transparent,black_100%)]"></div>
                                <div className="aspect-[76/59] border border-neutral-800 rounded-lg overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80"
                                        className="w-full h-full object-cover opacity-80"
                                        alt="AI wedding design"
                                        width={1207}
                                        height={929}
                                    />
                                </div>
                            </div>
                        </div>
                    </FeatureCard>

                    <FeatureCard className="p-6 lg:col-span-2">
                        <p className="mx-auto my-6 max-w-md text-balance text-center text-2xl font-light text-white">
                            Collaborate with vendors, planners, and family in real-time.
                        </p>

                        <div className="flex justify-center gap-6 overflow-hidden">
                            <CircularUI
                                label="Design"
                                circles={[{ pattern: 'border' }, { pattern: 'border' }]}
                            />

                            <CircularUI
                                label="Review"
                                circles={[{ pattern: 'none' }, { pattern: 'primary' }]}
                            />

                            <CircularUI
                                label="Share"
                                circles={[{ pattern: 'blue' }, { pattern: 'none' }]}
                            />

                            <CircularUI
                                label="Export"
                                circles={[{ pattern: 'primary' }, { pattern: 'none' }]}
                                className="hidden sm:block"
                            />
                        </div>
                    </FeatureCard>
                </div>
            </div>
        </section>
    )
}

interface FeatureCardProps {
    children: ReactNode
    className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <div className={cn('group relative rounded-none bg-neutral-900/50 border border-neutral-800', className)}>
        <CardDecorator />
        {children}
    </div>
)

const CardDecorator = () => (
    <>
        <span className="border-white/30 absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-white/30 absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-white/30 absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-white/30 absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
    </>
)

interface CardHeadingProps {
    icon: LucideIcon
    title: string
    description: string
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
    <div className="p-6">
        <span className="text-neutral-500 flex items-center gap-2 text-sm">
            <Icon className="size-4" />
            {title}
        </span>
        <p className="mt-6 text-xl font-light text-white">{description}</p>
    </div>
)

interface CircleConfig {
    pattern: 'none' | 'border' | 'primary' | 'blue'
}

interface CircularUIProps {
    label: string
    circles: CircleConfig[]
    className?: string
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
    <div className={className}>
        <div className="bg-gradient-to-b from-neutral-700 size-fit rounded-2xl to-transparent p-px">
            <div className="bg-gradient-to-b from-neutral-900 to-neutral-800/25 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-4">
                {circles.map((circle, i) => (
                    <div
                        key={i}
                        className={cn('size-7 rounded-full border sm:size-8', {
                            'border-white/30': circle.pattern === 'none',
                            'border-white/30 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'border',
                            'border-white/30 bg-neutral-900 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.3),rgba(255,255,255,0.3)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'primary',
                            'bg-neutral-900 z-1 border-neutral-500 bg-[repeating-linear-gradient(-45deg,rgba(115,115,115,1),rgba(115,115,115,1)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'blue',
                        })}></div>
                ))}
            </div>
        </div>
        <span className="text-neutral-500 mt-1.5 block text-center text-sm">{label}</span>
    </div>
)
