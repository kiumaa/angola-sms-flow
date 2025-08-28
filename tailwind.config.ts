import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Outfit', 'Inter', 'Sora', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
				'inter': ['Inter', 'sans-serif'],
				'sora': ['Sora', 'sans-serif'],
				'outfit': ['Outfit', 'sans-serif'],
			},
			fontSize: {
				'h1': ['1.75rem', { lineHeight: '2rem', fontWeight: '300' }],
				'h2': ['1.25rem', { lineHeight: '1.5rem', fontWeight: '300' }],
				'h3': ['1rem', { lineHeight: '1.25rem', fontWeight: '400' }],
				'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '300' }],
			},
			letterSpacing: {
				'tighter': '-0.02em',
				'tight': '-0.01em',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Custom Sophisticated Grays
				gray: {
					100: 'hsl(var(--gray-100))',
					200: 'hsl(var(--gray-200))',
					300: 'hsl(var(--gray-300))',
					400: 'hsl(var(--gray-400))',
					500: 'hsl(var(--gray-500))',
					600: 'hsl(var(--gray-600))',
					700: 'hsl(var(--gray-700))',
					800: 'hsl(var(--gray-800))',
					900: 'hsl(var(--gray-900))'
				},
				// Glass & Gradient Effects
				glass: {
					DEFAULT: 'rgba(var(--glass-bg))',
					border: 'rgba(var(--glass-border))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-glass': 'var(--gradient-glass)',
				'gradient-border': 'var(--gradient-border)',
				'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))'
			},
			boxShadow: {
				'glass': 'var(--shadow-glass)',
				'glow': 'var(--shadow-glow)',
				'elevated': 'var(--shadow-elevated)',
				'elegant': 'var(--shadow-elegant)',
				'modern': 'var(--shadow-modern)',
				'premium': 'var(--shadow-premium)',
				'futuristic': '0 4px 12px 0 hsl(0 0% 0% / 0.05)',
				'hover': '0 10px 24px 0 hsl(0 0% 0% / 0.08)',
				'minimal': '0 1px 2px 0 hsl(0 0% 0% / 0.05)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': 'var(--radius-lg)',
				'3xl': 'var(--radius-xl)',
				'minimal': '4px'
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem'
			},
			backdropBlur: {
				'xs': '2px',
				'glass': 'var(--backdrop-blur)'
			},
			transitionTimingFunction: {
				'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
				'apple': 'cubic-bezier(0.4, 0, 0.2, 1)'
			},
			backdropBlur: {
				'xs': '2px'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'slide-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'scale-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'pulse-soft': {
					'0%, 100%': {
						opacity: '1'
					},
					'50%': {
						opacity: '0.5'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'glow': {
					'0%': {
						boxShadow: 'var(--shadow-glass)'
					},
					'100%': {
						boxShadow: 'var(--shadow-glow)'
					}
				},
				'slide-up-stagger': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'ripple': {
					'0%': {
						transform: 'scale(0)',
						opacity: '1'
					},
					'100%': {
						transform: 'scale(4)',
						opacity: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-up': 'slide-up 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
				'slide-in': 'slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				'scale-in': 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'float': 'float 6s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'slide-up-stagger': 'slide-up-stagger 0.6s ease-out forwards',
				'ripple': 'ripple 0.6s linear'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
