<?php
/**
 * Template Name: Home - Veritas Building Group
 * Description: Magazine-style home page for Veritas Building Group
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Veritas Building Group - Building Excellence with Integrity</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Veritas Building Group is the construction partner Vancouver homeowners trust for kitchen and bathroom transformations that look incredible and last.">
    <meta name="keywords" content="kitchen remodeling, bathroom remodeling, home remodeling, Vancouver contractor, construction, home additions">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://veribuilds.com/">
    <meta property="og:title" content="Veritas Building Group">
    <meta property="og:description" content="Building Excellence with Integrity | Vancouver's Premier Home Remodeling Experts">
    <meta property="og:image" content="https://roosterconstruction.org/wp-content/uploads/2025/09/RC_PalmSprings_202507-22-scaled.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Veritas Building Group">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://veribuilds.com/">
    <meta property="twitter:title" content="Veritas Building Group">
    <meta property="twitter:description" content="Building Excellence with Integrity | Vancouver's Premier Home Remodeling Experts">
    <meta property="twitter:image" content="https://roosterconstruction.org/wp-content/uploads/2025/09/RC_PalmSprings_202507-22-scaled.jpg">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#5DC1D8">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/veribuilds.com/my-favicon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/veribuilds.com/my-favicon/favicon.svg" />
    <link rel="shortcut icon" href="/veribuilds.com/my-favicon/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/veribuilds.com/my-favicon/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-title" content="VeriBuilds" />
    <link rel="manifest" href="/veribuilds.com/my-favicon/site.webmanifest" />
    
    <!-- Preload critical fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:wght@300;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:wght@300;400;500;600;700&display=swap" rel="stylesheet"></noscript>
    <style>
:root {
    --navy: #1a2332;
    --navy-dark: #0f1823;
    --teal: #5DC1D8;
    --teal-dark: #3AACCA;
    --tan: #B7B1A9;
    --white: #FFFFFF;
    --cream: #f8f6f3;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Montserrat', sans-serif;
    overflow-x: hidden;
    background: #FFFFFF;
    color: var(--navy);
    scroll-behavior: smooth;
}

html {
    scroll-snap-type: none;
}

/* Animated Background with Construction Theme */
.background-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
    display: none;
}

/* Abstract Organic Shapes - Bold & Vibrant */
.construction-element {
    position: absolute;
    opacity: 0.25;
    animation: liquidFloat 20s ease-in-out infinite;
    mix-blend-mode: multiply;
}

.element-1 {
    width: 500px;
    height: 500px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--navy) 100%);
    top: 10%;
    left: 5%;
    border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
    filter: blur(60px);
    animation: liquidFloat 18s ease-in-out infinite, morphBlob1 12s ease-in-out infinite;
}

.element-2 {
    width: 450px;
    height: 450px;
    background: linear-gradient(225deg, var(--tan) 0%, var(--teal) 100%);
    top: 50%;
    right: 10%;
    border-radius: 41% 59% 58% 42% / 45% 60% 40% 55%;
    filter: blur(60px);
    animation: liquidFloat 22s ease-in-out infinite, morphBlob2 14s ease-in-out infinite;
    animation-delay: 5s;
}

.element-3 {
    width: 400px;
    height: 400px;
    background: linear-gradient(315deg, var(--navy) 0%, var(--tan) 100%);
    bottom: 15%;
    left: 30%;
    border-radius: 47% 53% 41% 59% / 53% 47% 53% 47%;
    filter: blur(60px);
    animation: liquidFloat 25s ease-in-out infinite, morphBlob3 16s ease-in-out infinite;
    animation-delay: 10s;
}

@keyframes liquidFloat {
    0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
    25% { transform: translate(50px, -60px) rotate(10deg) scale(1.15); }
    50% { transform: translate(-40px, 40px) rotate(-8deg) scale(0.9); }
    75% { transform: translate(60px, 20px) rotate(6deg) scale(1.1); }
}

@keyframes morphBlob1 {
    0%, 100% { border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%; }
    25% { border-radius: 47% 53% 68% 32% / 42% 58% 42% 58%; }
    50% { border-radius: 38% 62% 45% 55% / 63% 37% 63% 37%; }
    75% { border-radius: 55% 45% 33% 67% / 48% 62% 38% 52%; }
}

@keyframes morphBlob2 {
    0%, 100% { border-radius: 41% 59% 58% 42% / 45% 60% 40% 55%; }
    33% { border-radius: 58% 42% 35% 65% / 52% 48% 52% 48%; }
    66% { border-radius: 35% 65% 52% 48% / 58% 42% 58% 42%; }
}

@keyframes morphBlob3 {
    0%, 100% { border-radius: 47% 53% 41% 59% / 53% 47% 53% 47%; }
    20% { border-radius: 62% 38% 55% 45% / 48% 52% 48% 52%; }
    40% { border-radius: 33% 67% 48% 52% / 62% 38% 62% 38%; }
    60% { border-radius: 55% 45% 62% 38% / 45% 55% 45% 55%; }
    80% { border-radius: 48% 52% 33% 67% / 58% 42% 58% 42%; }
}

/* Glass Morphism Navigation */
nav {
    position: fixed;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 60px;
    padding: 12px 35px;
    z-index: 1000;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: slideDown 0.8s ease-out;
    transition: all 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-60px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

nav ul {
    display: flex;
    list-style: none;
    gap: 45px;
    align-items: center;
}

.logo-text {
    font-weight: 700;
    font-size: 20px;
    color: var(--white);
    letter-spacing: 0.5px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
}

nav a {
    color: var(--white);
    text-decoration: none;
    font-weight: 500;
    font-size: 15px;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    position: relative;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

nav a::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--tan);
    transition: width 0.3s ease;
}

nav a:hover::after {
    width: 100%;
}

nav a:hover {
    color: var(--tan);
    transform: translateY(-2px);
}

nav.scrolled {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(93, 193, 216, 0.3);
    box-shadow: 0 10px 40px rgba(93, 193, 216, 0.2);
}

nav.scrolled .logo-text {
    color: var(--teal);
    text-shadow: 0 2px 10px rgba(93, 193, 216, 0.3);
}

nav.scrolled a {
    color: var(--navy);
    text-shadow: none;
}

nav.scrolled a:hover {
    color: var(--teal);
}

nav.scrolled a::after {
    background: linear-gradient(90deg, var(--teal), var(--tan));
}

/* Hero Section - Magazine Style Split Layout */
.hero {
    height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    padding: 0;
    margin: 0;
    position: relative;
    overflow: hidden;
    background: var(--cream);
    scroll-snap-align: start;
}

.hero-video {
    display: none;
}

.hero-video-overlay {
    display: none;
}

.hero-content {
    text-align: left;
    max-width: 580px;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
    animation: fadeInUp 1s ease-out;
    position: relative;
    z-index: 2;
    padding: 50px 50px 50px 50px;
    margin: 0;
    margin-left: 80px;
    margin-top: auto;
    margin-bottom: auto;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(30px);
    border-radius: 30px;
    box-shadow: 0 25px 80px rgba(26, 35, 50, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.6);
}

.hero-content::-webkit-scrollbar {
    width: 6px;
}

.hero-content::-webkit-scrollbar-track {
    background: rgba(26, 35, 50, 0.05);
    border-radius: 10px;
}

.hero-content::-webkit-scrollbar-thumb {
    background: rgba(26, 35, 50, 0.2);
    border-radius: 10px;
}

.hero-content::-webkit-scrollbar-thumb:hover {
    background: rgba(26, 35, 50, 0.3);
}

.hero-image-container {
    position: relative;
    height: 100vh;
    overflow: hidden;
}

.hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    animation: subtleZoom 20s ease-in-out infinite alternate;
}

@keyframes subtleZoom {
    0% {
        transform: scale(1);
    }
    100% {
        transform: scale(1.05);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(60px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.hero-badge {
    display: inline-block;
    padding: 8px 20px;
    background: rgba(93, 193, 216, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(93, 193, 216, 0.3);
    border-radius: 50px;
    color: var(--teal);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 20px;
    animation: fadeInUp 1.2s ease-out;
    text-transform: uppercase;
}

.hero h1 {
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 400;
    line-height: 1.15;
    margin-bottom: 25px;
    padding-top: 0;
    color: var(--navy);
    letter-spacing: -0.02em;
    font-family: 'Playfair Display', serif;
}

@keyframes textShimmer {
    0%, 100% { background-position: 0% center; }
    50% { background-position: 100% center; }
}

.hero p {
    font-size: clamp(14px, 1.6vw, 16px);
    line-height: 1.6;
    margin-bottom: 30px;
    color: var(--navy);
    font-weight: 400;
    opacity: 0.85;
}

.hero-description-short {
    display: none;
}

.hero-description-full {
    display: block;
}

.hero-stats {
    display: flex;
    gap: 40px;
    justify-content: flex-start;
    margin-bottom: 40px;
    flex-wrap: wrap;
}

.stat-item {
    text-align: left;
}

.stat-number {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: 800;
    color: var(--navy);
    line-height: 1;
    margin-bottom: 6px;
}

.stat-number-highlight {
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-label {
    font-size: 11px;
    color: var(--navy);
    font-weight: 600;
    letter-spacing: 1.5px;
    opacity: 0.6;
    text-transform: uppercase;
}

.cta-buttons {
    display: flex;
    gap: 20px;
    justify-content: flex-start;
    flex-wrap: wrap;
}

.hero-testimonial {
    margin-top: 30px;
    padding-top: 25px;
    border-top: 1px solid rgba(26, 35, 50, 0.1);
}

.testimonial-avatars {
    display: flex;
    margin-bottom: 12px;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid white;
    margin-left: -12px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 14px;
}

.avatar:first-child {
    margin-left: 0;
}

.avatar.count {
    background: var(--navy);
    font-size: 12px;
}

.testimonial-text {
    font-size: 13px;
    color: var(--navy);
    opacity: 0.75;
    line-height: 1.5;
}

.testimonial-text strong {
    color: var(--navy);
    opacity: 1;
    font-weight: 700;
}

.testimonial-link {
    color: var(--teal);
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 1px solid var(--teal);
    padding-bottom: 2px;
}

.testimonial-link:hover {
    color: var(--teal-dark);
    border-bottom-color: var(--teal-dark);
}

.btn {
    padding: 18px 40px;
    border-radius: 60px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.4s ease;
    cursor: pointer;
    border: none;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.5px;
}

.btn-primary {
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%);
    color: var(--white);
    box-shadow: 0 10px 30px rgba(93, 193, 216, 0.35);
}

.btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--teal-dark) 0%, var(--teal) 100%);
    transition: left 0.4s ease;
    z-index: -1;
}

.btn-primary:hover::before {
    left: 0;
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(93, 193, 216, 0.45);
}

.btn-secondary {
    background: transparent;
    backdrop-filter: none;
    border: 2px solid var(--navy);
    color: var(--navy);
}

.btn-secondary:hover {
    background: var(--navy);
    border-color: var(--navy);
    color: var(--white);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(26, 35, 50, 0.2);
}

.services-header .btn-secondary {
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: var(--white);
}

.services-header .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--white);
    color: var(--white);
}

/* Services Section with Grid Layout */
.services {
    padding: 80px 50px;
    position: relative;
    background: var(--white);
    transform-style: preserve-3d;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
}


.section-title {
    text-align: center;
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 700;
    margin-bottom: 20px;
    color: var(--navy);
}

.services .section-title {
    text-align: left;
    color: var(--navy);
    font-size: clamp(40px, 5vw, 56px);
    font-weight: 300;
    font-family: 'Playfair Display', serif;
    line-height: 1.1;
    margin-bottom: 8px;
}

.services .section-label {
    color: var(--tan);
    font-size: 12px;
    letter-spacing: 3px;
    font-weight: 600;
    margin-bottom: 15px;
    display: block;
}

.projects .section-title {
    display: none;
}

.projects .section-subtitle {
    display: none;
}

.section-subtitle {
    text-align: center;
    font-size: clamp(16px, 1.8vw, 20px);
    color: var(--navy);
    opacity: 0.8;
    margin-bottom: 50px;
    font-weight: 400;
}

.services .section-subtitle {
    display: none;
}

.services-header {
    max-width: 1400px;
    margin: 0 auto 40px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 60px;
}

.services-header-content {
    flex: 1;
}

.services-header .btn {
    white-space: nowrap;
}

.services-header .btn-secondary {
    background: transparent;
    border: 2px solid var(--navy);
    color: var(--navy);
}

.services-header .btn-secondary:hover {
    background: var(--navy);
    color: var(--white);
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    max-width: 1400px;
    margin: 0 auto;
}

.service-card {
    background: var(--white);
    backdrop-filter: none;
    border: 1px solid rgba(183, 177, 169, 0.3);
    border-radius: 20px;
    padding: 40px 30px;
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 5px 20px rgba(26, 35, 50, 0.05);
    text-align: center;
    min-height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.service-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(93, 193, 216, 0.03), rgba(26, 35, 50, 0.03));
    opacity: 0;
    transition: opacity 0.4s ease;
}

.service-card:hover::before {
    opacity: 1;
}

.service-card:hover {
    transform: translateY(-8px);
    border-color: var(--navy);
    box-shadow: 0 15px 40px rgba(26, 35, 50, 0.12);
    background: var(--white);
}


.service-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 20px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.service-icon svg {
    width: 45px;
    height: 45px;
    stroke: var(--tan);
    fill: none;
    stroke-width: 1.5;
    transition: all 0.4s ease;
}

.service-card:hover .service-icon svg {
    stroke: var(--navy);
    transform: scale(1.1);
}

.service-card h3 {
    font-size: clamp(14px, 1.6vw, 17px);
    margin-bottom: 0;
    color: var(--navy);
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.service-card p {
    display: none;
}

/* Interactive Project Showcase - Testimonial Style */
.projects {
    min-height: 100vh;
    padding: 0;
    background: #FFFFFF;
    position: relative;
    transform-style: preserve-3d;
    scroll-snap-align: start;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
}

/* About Section */
.about {
    padding: 100px 50px;
    background: var(--cream);
    position: relative;
}

.about-container {
    max-width: 1300px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
}

.section-label {
    display: inline-block;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--teal);
    margin-bottom: 20px;
    text-transform: uppercase;
}

.about-content h2 {
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 700;
    margin-bottom: 30px;
    color: var(--navy);
    line-height: 1.2;
}

.about-content p {
    font-size: 16px;
    line-height: 1.8;
    color: var(--navy);
    opacity: 0.85;
    margin-bottom: 20px;
}

.about-content .btn {
    margin-top: 20px;
}

.about-images {
    position: relative;
}

.about-image-main {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(26, 35, 50, 0.15);
    border: 1px solid rgba(183, 177, 169, 0.3);
}

.about-image-main img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.6s ease;
}

.about-image-main:hover img {
    transform: scale(1.05);
}

/* Team Section */
.team {
    padding: 100px 50px;
    background: #FFFFFF;
    position: relative;
}

.team-container {
    max-width: 1300px;
    margin: 0 auto;
    display: flex;
    justify-content: flex-end;
}

.team-content {
    max-width: 600px;
    text-align: left;
}

.team-content h2 {
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 700;
    margin-bottom: 25px;
    color: var(--navy);
    line-height: 1.2;
}

.team-content p {
    font-size: 17px;
    line-height: 1.8;
    color: var(--navy);
    opacity: 0.85;
    margin-bottom: 30px;
    max-width: 700px;
}

/* Testimonials Section */
.testimonials {
    padding: 100px 50px;
    background: var(--cream);
    position: relative;
}

.testimonial-rating {
    text-align: center;
    margin-bottom: 20px;
}

.testimonial-rating .stars {
    font-size: 32px;
    color: #FFB800;
    margin-bottom: 10px;
    letter-spacing: 4px;
}

.testimonial-rating p {
    font-size: 15px;
    color: var(--navy);
    opacity: 0.7;
}

.testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 30px;
    max-width: 1300px;
    margin: 0 auto 50px;
}

.testimonial-card {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(183, 177, 169, 0.3);
    border-radius: 20px;
    padding: 35px;
    transition: all 0.4s ease;
    box-shadow: 0 8px 25px rgba(26, 35, 50, 0.08);
}

.testimonial-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(93, 193, 216, 0.2);
    border-color: var(--teal);
}

.testimonial-content {
    margin-bottom: 25px;
}

.testimonial-content p {
    font-size: 15px;
    line-height: 1.7;
    color: var(--navy);
    opacity: 0.85;
    font-style: italic;
    position: relative;
    padding-left: 25px;
}

.testimonial-content p::before {
    content: '"';
    position: absolute;
    left: 0;
    top: -5px;
    font-size: 48px;
    color: var(--teal);
    opacity: 0.3;
    font-family: Georgia, serif;
    line-height: 1;
}

.testimonial-author {
    display: flex;
    align-items: center;
    gap: 15px;
}

.author-icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
    font-weight: 700;
    flex-shrink: 0;
}

.testimonial-author strong {
    display: block;
    font-size: 16px;
    color: var(--navy);
    margin-bottom: 4px;
}

.testimonial-author span {
    font-size: 13px;
    color: var(--navy);
    opacity: 0.6;
}

.testimonial-cta {
    text-align: center;
}

/* Partners Section */
.partners {
    padding: 60px 50px;
    background: #FFFFFF;
    text-align: center;
}

.partners h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--navy);
    opacity: 0.6;
    margin-bottom: 40px;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.partners-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 40px;
    max-width: 1000px;
    margin: 0 auto;
    align-items: center;
}

.partner-logo {
    font-size: 20px;
    font-weight: 700;
    color: var(--navy);
    opacity: 0.4;
    letter-spacing: 1px;
    transition: all 0.3s ease;
}

.partner-logo:hover {
    opacity: 0.8;
    transform: scale(1.05);
}


.projects-image-container {
    position: relative;
    height: 100vh;
    overflow: hidden;
}

.projects-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
}

.projects-content {
    padding: 60px 80px;
    max-width: 650px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.projects-masonry {
    display: none;
}

.project-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(26, 35, 50, 0.08);
    border-radius: 30px;
    overflow: visible;
    transition: opacity 0.3s ease, transform 0.3s ease;
    cursor: default;
    position: relative;
    box-shadow: 0 25px 80px rgba(26, 35, 50, 0.12);
    padding: 50px;
    margin-bottom: 0;
}

.project-card::before {
    content: '\201C';
    position: absolute;
    top: 15px;
    left: 35px;
    font-size: 100px;
    color: rgba(93, 193, 216, 0.15);
    font-family: Georgia, serif;
    line-height: 1;
}

.project-quote {
    font-size: clamp(22px, 2.5vw, 32px);
    line-height: 1.4;
    color: var(--navy);
    font-weight: 700;
    margin-bottom: 35px;
    position: relative;
    z-index: 2;
}

.project-author {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 30px;
}

.project-author-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--navy);
}

.project-tag {
    font-size: 14px;
    color: var(--navy);
    opacity: 0.5;
    font-weight: 500;
}

.project-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--teal);
    font-weight: 600;
    font-size: 16px;
    text-decoration: none;
    transition: all 0.3s ease;
    border-bottom: 2px solid transparent;
    padding-bottom: 4px;
}

.project-link:hover {
    border-bottom-color: var(--teal);
    gap: 15px;
}

.project-navigation {
    display: flex;
    gap: 15px;
    margin-top: 40px;
}

.nav-arrow {
    width: 50px;
    height: 50px;
    border: 1px solid rgba(26, 35, 50, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
}

.nav-arrow:hover {
    background: var(--cream);
    border-color: var(--navy);
    transform: scale(1.05);
}

.nav-arrow svg {
    width: 20px;
    height: 20px;
    stroke: var(--navy);
    fill: none;
    stroke-width: 2;
}

/* Contact Section with Motion */
.contact {
    min-height: 100vh;
    padding: 100px 50px;
    position: relative;
    background: var(--cream);
    transform-style: preserve-3d;
    scroll-snap-align: start;
    display: flex;
    align-items: center;
}


.contact-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
}

.contact-content h2 {
    font-size: clamp(40px, 5vw, 56px);
    font-weight: 400;
    margin-bottom: 30px;
    color: var(--navy);
    font-family: 'Playfair Display', serif;
    line-height: 1.2;
    letter-spacing: -0.01em;
}

.contact-content p {
    font-size: 16px;
    color: var(--navy);
    opacity: 0.8;
    line-height: 1.7;
    margin-bottom: 50px;
}

.contact-info-item {
    display: block;
    margin-bottom: 25px;
    padding: 0;
    background: transparent;
    backdrop-filter: none;
    border-radius: 0;
    border: none;
    transition: all 0.3s ease;
    text-decoration: none;
}

.contact-info-item:hover {
    background: transparent;
    transform: none;
    border-color: transparent;
    box-shadow: none;
}

.contact-info-item:hover .contact-info-text {
    color: var(--teal);
}

.contact-info-text {
    color: var(--navy);
    font-size: 18px;
    font-weight: 500;
    transition: color 0.3s ease;
    display: block;
}

.contact-icon {
    display: none;
}

.contact-form {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(183, 177, 169, 0.3);
    border-radius: 20px;
    padding: 50px;
    box-shadow: 0 20px 60px rgba(26, 35, 50, 0.1);
    position: relative;
}

.contact-form::before,
.contact-form::after {
    display: none;
}

.contact-form-corners {
    display: none;
}

.form-group {
    margin-bottom: 25px;
}

.form-group label {
    display: block;
    margin-bottom: 10px;
    color: var(--navy);
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 16px 20px;
    background: var(--white);
    border: 2px solid rgba(26, 35, 50, 0.1);
    border-radius: 12px;
    color: var(--navy);
    font-family: 'Montserrat', sans-serif;
    font-size: 15px;
    transition: all 0.3s ease;
}

.form-group select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231a2332' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 20px center;
    padding-right: 45px;
    cursor: pointer;
}

.form-group select option {
    background: var(--white);
    color: var(--navy);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
    color: rgba(26, 35, 50, 0.4);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    background: var(--white);
    border-color: var(--teal);
    box-shadow: 0 0 0 4px rgba(93, 193, 216, 0.1);
}

.form-group textarea {
    resize: vertical;
    min-height: 120px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.contact-form .btn-primary {
    width: 100%;
    margin-top: 15px;
}

/* Scroll Indicator */
.scroll-indicator {
    display: none;
}

/* Parallax Scrollytelling Effects */
.parallax-layer {
    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.fade-in-up {
    opacity: 0;
    transform: translateY(80px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.fade-in-up.visible {
    opacity: 1;
    transform: translateY(0);
}

.scale-in {
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.scale-in.visible {
    opacity: 1;
    transform: scale(1);
}

.slide-in-left {
    opacity: 0;
    transform: translateX(-100px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.slide-in-left.visible {
    opacity: 1;
    transform: translateX(0);
}

.slide-in-right {
    opacity: 0;
    transform: translateX(100px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.slide-in-right.visible {
    opacity: 1;
    transform: translateX(0);
}


/* Responsive Design */
@media (max-width: 1200px) {
    .services-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 968px) {
    nav {
        padding: 12px 20px;
        top: 15px;
    }

    nav ul {
        gap: 15px;
    }

    nav a {
        font-size: 12px;
    }

    .logo-text {
        font-size: 16px;
    }

    .hero {
        grid-template-columns: 1fr;
        height: 100vh;
        padding: 0;
        overflow: hidden;
    }

    .hero-content {
        margin-left: 0;
        margin-right: 0;
        padding: 25px 25px 30px;
        max-width: 100%;
        max-height: calc(100vh - 80px);
        overflow-y: auto;
        margin-top: 55px;
        margin-bottom: 25px;
        -webkit-overflow-scrolling: touch;
    }
    
    .hero-content::-webkit-scrollbar {
        width: 4px;
    }
    
    .hero-content::-webkit-scrollbar-track {
        background: rgba(26, 35, 50, 0.05);
        border-radius: 10px;
    }
    
    .hero-content::-webkit-scrollbar-thumb {
        background: rgba(26, 35, 50, 0.2);
        border-radius: 10px;
    }
    
    .hero-description-full {
        display: none;
    }
    
    .hero-description-short {
        display: block;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 15px;
    }
    
    .hero h1 {
        font-size: clamp(32px, 8vw, 48px);
        margin-bottom: 18px;
    }
    
    .hero-badge {
        margin-bottom: 15px;
        font-size: 10px;
    }
    
    .hero-testimonial {
        margin-top: 15px;
        padding-top: 15px;
        padding-bottom: 25px;
    }
    
    .testimonial-text {
        font-size: 12px;
    }
    
    .cta-buttons {
        margin-top: 20px;
        flex-direction: row;
        gap: 10px;
    }
    
    .cta-buttons .btn {
        font-size: 14px;
        padding: 14px 24px;
        flex: 1;
    }

    .hero-image-container {
        height: 400px;
        order: -1;
        margin: 0 -25px;
    }

    .hero-stats {
        gap: 30px;
    }

    .services, .projects, .contact, .about, .team, .testimonials {
        padding: 60px 25px;
    }

    .services-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .service-card {
        padding: 40px 25px;
        min-height: 200px;
    }

    .services-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 30px;
    }

    .services-header .btn {
        align-self: flex-start;
    }

    .projects {
        grid-template-columns: 1fr;
        min-height: auto;
    }

    .projects-image-container {
        height: 50vh;
        order: -1;
    }

    .projects-content {
        padding: 40px 25px;
        max-width: 100%;
    }

    .project-card {
        padding: 40px 30px;
    }

    .project-navigation {
        position: static;
        margin-top: 30px;
        justify-content: center;
    }

    .about-container {
        grid-template-columns: 1fr;
        gap: 40px;
    }

    .about-images {
        order: -1;
    }

    .testimonials-grid {
        grid-template-columns: 1fr;
    }

    .testimonial-card {
        padding: 25px;
    }

    .partners-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
    }

    .contact-container {
        grid-template-columns: 1fr;
        gap: 40px;
    }

    .contact-form {
        padding: 30px;
    }

    .cta-buttons {
        flex-direction: column;
        align-items: stretch;
    }

    .btn {
        width: 100%;
    }

    .section-title {
        font-size: clamp(32px, 8vw, 48px);
    }

    .section-subtitle {
        font-size: clamp(14px, 4vw, 18px);
    }
}

    </style>
</head>
<body>
    <!-- Animated Background -->
    <div class="background-container">
        <div class="gradient-bg"></div>
        <div class="construction-element element-1"></div>
        <div class="construction-element element-2"></div>
        <div class="construction-element element-3"></div>
    </div>

    <!-- Glass Morphism Navigation -->
    <nav>
        <ul>
            <li><span class="logo-text">VERITAS</span></li>
            <li><a href="https://veribuilds.com">Home</a></li>
            <li><a href="https://veribuilds.com/about">About</a></li>
            <li><a href="https://veribuilds.com/services">Services</a></li>
            <li><a href="https://veribuilds.com/general-contractor-vancouver-wa-faq/">FAQs</a></li>
        </ul>
    </nav>

    <main>
    <!-- Hero Section -->
    <section class="hero" id="home">
        <div class="hero-content">
            <span class="hero-badge">Vancouver's Trusted Builder</span>
            <h1>Building Excellence with Integrity</h1>
            <p class="hero-description-full">Veritas Building Group is the construction partner Vancouver homeowners trust for kitchen and bathroom transformations that look incredible and last.</p>
            <p class="hero-description-short">Vancouver's trusted construction partner for kitchen and bathroom transformations that look incredible and last.</p>
            
            <div class="hero-testimonial">
                <div class="testimonial-avatars">
                    <div class="avatar">T</div>
                    <div class="avatar">J</div>
                    <div class="avatar">M</div>
                    <div class="avatar count">100+</div>
                </div>
                <div class="testimonial-text">
                    <strong>100+ satisfied customers</strong> trust Veritas Building Group for their remodeling works
                </div>
            </div>
        </div>
        
        <div class="hero-image-container">
            <img src="https://roosterconstruction.org/wp-content/uploads/2025/09/RC_PalmSprings_202507-22-scaled.jpg" alt="Beautiful kitchen remodel" class="hero-image" width="2560" height="1707" loading="eager">
        </div>
    </section>

    <!-- Services Section -->
    <section class="services" id="services">
        <div class="services-header">
            <div class="services-header-content">
                <span class="section-label">WHAT WE DO</span>
                <h2 class="section-title">Home Remodeling Services</h2>
            </div>
            <a href="#contact" class="btn btn-secondary">ALL SERVICES →</a>
        </div>
        
        <div class="services-grid">
            <div class="service-card">
                <div class="service-icon">
                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <rect x="12" y="28" width="40" height="24" rx="2"/>
                        <rect x="20" y="20" width="24" height="8"/>
                        <line x1="28" y1="36" x2="36" y2="36"/>
                        <line x1="28" y1="42" x2="36" y2="42"/>
                        <circle cx="24" cy="36" r="2"/>
                        <circle cx="40" cy="36" r="2"/>
                        <circle cx="24" cy="42" r="2"/>
                        <circle cx="40" cy="42" r="2"/>
                    </svg>
                </div>
                <h3>Kitchen Remodeling</h3>
            </div>

            <div class="service-card">
                <div class="service-icon">
                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <rect x="16" y="24" width="32" height="24" rx="2"/>
                        <rect x="20" y="28" width="8" height="16"/>
                        <circle cx="40" cy="32" r="3"/>
                        <line x1="36" y1="44" x2="44" y2="44"/>
                        <path d="M24 20 L24 24 M28 20 L28 24"/>
                    </svg>
                </div>
                <h3>Bathroom Remodeling</h3>
            </div>

            <div class="service-card">
                <div class="service-icon">
                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <path d="M32 12 L48 24 L48 48 L16 48 L16 24 Z"/>
                        <rect x="28" y="36" width="8" height="12"/>
                        <rect x="22" y="28" width="6" height="6"/>
                        <rect x="36" y="28" width="6" height="6"/>
                        <line x1="32" y1="12" x2="32" y2="8"/>
                    </svg>
                </div>
                <h3>Whole Home Remodels</h3>
            </div>

            <div class="service-card">
                <div class="service-icon">
                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 32 L32 20 L48 32 L48 52 L16 52 Z"/>
                        <rect x="28" y="40" width="8" height="12"/>
                        <rect x="22" y="32" width="6" height="6"/>
                        <rect x="36" y="32" width="6" height="6"/>
                    </svg>
                </div>
                <h3>Home Additions</h3>
            </div>

            <div class="service-card">
                <div class="service-icon">
                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <rect x="12" y="20" width="40" height="32" rx="2"/>
                        <line x1="12" y1="28" x2="52" y2="28"/>
                        <rect x="20" y="34" width="10" height="12"/>
                        <rect x="34" y="34" width="10" height="12"/>
                        <line x1="32" y1="20" x2="32" y2="16"/>
                    </svg>
                </div>
                <h3>ADUs</h3>
            </div>

            <div class="service-card">
                <div class="service-icon">
                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 28 L32 20 L44 28 L44 48 L20 48 Z"/>
                        <rect x="28" y="38" width="8" height="10"/>
                        <rect x="24" y="30" width="5" height="5"/>
                        <rect x="35" y="30" width="5" height="5"/>
                        <line x1="16" y1="48" x2="48" y2="48"/>
                    </svg>
                </div>
                <h3>Basement Remodeling</h3>
            </div>
        </div>
    </section>

    <!-- Projects Section -->
    <section class="projects" id="projects">
        <div class="projects-image-container">
            <img src="https://roosterconstruction.org/wp-content/uploads/2025/09/RC_PalmSprings_202507-34-scaled.jpg" alt="Bathroom Remodel" class="projects-image" width="2560" height="1707" loading="lazy">
        </div>
        
        <div class="projects-content">
            <div class="project-card">
                <p class="project-quote">They got my bathroom done a few weeks sooner than expected, which is amazing! I will definitely hire Veritas for future projects.</p>
                
                <div class="project-author">
                    <span class="project-author-name">— Terri L.</span>
                    <span class="project-tag">Bathroom Remodel</span>
                </div>
                
                <a href="#testimonials" class="project-link">
                    View Project →
                </a>
            </div>
            
            <div class="project-navigation">
                <div class="nav-arrow" onclick="previousProject()">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </div>
                <div class="nav-arrow" onclick="nextProject()">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </div>
            </div>
        </div>
    </section>

    <!-- Partners Section -->
    <section class="partners">
        <h3>Trusted Partners</h3>
        <div class="partners-grid">
            <div class="partner-logo">KOHLER</div>
            <div class="partner-logo">FERGUSON</div>
            <div class="partner-logo">SHERWIN-WILLIAMS</div>
            <div class="partner-logo">LOWE'S</div>
        </div>
    </section>

    <!-- About Section -->
    <section class="about" id="about">
        <div class="about-container">
            <div class="about-content">
                <span class="section-label">ABOUT US</span>
                <h2>Learn more about Veritas Building Group</h2>
                <p>Veritas Building Group began as a commitment to excellence in construction. Since our founding, our home improvement services have evolved to meet the needs of our clients. Learn more about what makes us one of the best builders in the region.</p>
                <p>Our process begins with a free consultation to discuss your vision. We provide clear, upfront estimates, so you know the costs involved from the start.</p>
                <p>Using top-quality materials and craftsmanship to bring your dream to life. We ensure clear communication and keep you informed every step of the way.</p>
                <p>At Veritas Building Group, your satisfaction is our priority. We build trust and lasting relationships with our clients.</p>
                <a href="#contact" class="btn btn-primary">MORE ABOUT US</a>
            </div>
            <div class="about-images">
                <div class="about-image-main">
                    <img src="https://roosterconstruction.org/wp-content/uploads/2025/09/RC_PalmSprings_202507-22-scaled.jpg" alt="Veritas Team" width="2560" height="1707" loading="lazy">
                </div>
            </div>
        </div>
    </section>

    <!-- Team Section -->
    <section class="team" id="team">
        <div class="team-container">
            <div class="team-content">
                <span class="section-label">OUR TEAM</span>
                <h2>We're proud of our team.</h2>
                <p>Our clients routinely say that our team — from designers to field technicians — feel like family by the end of their project. We truly enjoy working with our team and believe you will, too.</p>
                <a href="#contact" class="btn btn-secondary">MEET OUR TEAM</a>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="contact" id="contact">
        <div class="contact-container">
            <div class="contact-content">
                <h2>Start your remodel!</h2>
                <p>Our team is excited to discuss your vision. We offer free, no-obligation consultations to answer your questions and explore possibilities. Whether you work with us or not, we'll provide expert guidance and point you in the right direction. Tell us about your project, and we'll reach out soon.</p>
                
                <a href="tel:+13602295524" class="contact-info-item">
                    <span class="contact-info-text">+1 (360) 229-5524</span>
                </a>

                <a href="mailto:info@veribuilds.com" class="contact-info-item">
                    <span class="contact-info-text">info@veribuilds.com</span>
                </a>
            </div>

            <form class="contact-form" action="veritas-contact-handler.php" method="POST" id="contact-form">
                <div class="contact-form-corners contact-form-corner-bl"></div>
                <div class="contact-form-corners contact-form-corner-br"></div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="first-name">First Name</label>
                        <input type="text" id="first-name" name="first_name" required>
                    </div>

                    <div class="form-group">
                        <label for="last-name">Last Name</label>
                        <input type="text" id="last-name" name="last_name" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="email">Email*</label>
                        <input type="email" id="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="phone">Phone Number*</label>
                        <input type="tel" id="phone" name="phone" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="project-type">What type of project are you inquiring about?</label>
                    <select id="project-type" name="project_type" required>
                        <option value="">Please Select</option>
                        <option value="kitchen">Kitchen Remodeling</option>
                        <option value="bathroom">Bathroom Remodeling</option>
                        <option value="whole-home">Whole Home Remodel</option>
                        <option value="addition">Home Addition</option>
                        <option value="adu">ADU</option>
                        <option value="basement">Basement Remodeling</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="message">Tell us a little about your project</label>
                    <textarea id="message" name="message" required></textarea>
                </div>

                <button type="submit" class="btn btn-primary">Submit</button>
            </form>
        </div>
    </section>

    <script>
// Parallax effect for construction elements
document.addEventListener('mousemove', (e) => {
    const elements = document.querySelectorAll('.construction-element');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    elements.forEach((element, index) => {
        const speed = (index + 1) * 25;
        const xMove = (x - 0.5) * speed;
        const yMove = (y - 0.5) * speed;
        element.style.transform = `translate(${xMove}px, ${yMove}px)`;
    });
});

// Parallax Scrollytelling - Section transitions with depth
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    // Hero parallax
    const hero = document.querySelector('.hero');
    if (hero) {
        const heroVideo = document.querySelector('.hero-video');
        const heroContent = document.querySelector('.hero-content');
        if (heroVideo) {
            heroVideo.style.transform = `scale(${1 + scrolled * 0.0003})`;
        }
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
            heroContent.style.opacity = 1 - (scrolled / 800);
        }
    }
    
    // Section parallax effects
    const sections = document.querySelectorAll('.services, .projects, .contact');
    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const windowHeight = window.innerHeight;
        
        // Calculate parallax based on section position
        if (sectionTop < windowHeight && sectionTop > -sectionHeight) {
            const progress = (windowHeight - sectionTop) / (windowHeight + sectionHeight);
            const parallaxAmount = (progress - 0.5) * 50;
            
            // Apply subtle parallax to section backgrounds
            section.style.transform = `translateY(${parallaxAmount}px)`;
        }
    });
});

// Scrollytelling - Reveal animations on scroll
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
});

// Add scroll reveal classes to elements
document.addEventListener('DOMContentLoaded', () => {
    // Section titles fade in up
    document.querySelectorAll('.section-title').forEach(el => {
        el.classList.add('fade-in-up');
        scrollObserver.observe(el);
    });
    
    // Section subtitles fade in up with delay
    document.querySelectorAll('.section-subtitle').forEach(el => {
        el.classList.add('fade-in-up');
        el.style.transitionDelay = '0.2s';
        scrollObserver.observe(el);
    });
    
    // Service cards slide in from alternating sides
    document.querySelectorAll('.service-card').forEach((el, index) => {
        if (index % 2 === 0) {
            el.classList.add('slide-in-left');
        } else {
            el.classList.add('slide-in-right');
        }
        el.style.transitionDelay = `${index * 0.1}s`;
        scrollObserver.observe(el);
    });
    
    // Project cards scale in
    document.querySelectorAll('.project-card').forEach((el, index) => {
        el.classList.add('scale-in');
        el.style.transitionDelay = `${index * 0.15}s`;
        scrollObserver.observe(el);
    });
    
    // Contact section elements slide in
    const contactContent = document.querySelector('.contact-content');
    if (contactContent) {
        contactContent.classList.add('slide-in-left');
        scrollObserver.observe(contactContent);
    }
    
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.classList.add('slide-in-right');
        scrollObserver.observe(contactForm);
    }
});


// Smooth scroll for navigation
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards and project cards
document.querySelectorAll('.service-card, .project-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(60px)';
    el.style.transition = 'all 0.7s ease-out';
    observer.observe(el);
});

// Add stagger effect to service cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.12}s`;
});

// Add stagger effect to project cards
document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.15}s`;
});

// 3D tilt effect for project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
    });
});

// Animated counter for stats
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
};

// Trigger counter animation when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                const suffix = text.replace(/[0-9]/g, '');
                
                animateCounter(stat, number, 2000);
                setTimeout(() => {
                    stat.textContent = number + suffix;
                }, 2000);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// Dynamic gradient background based on scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const gradientBg = document.querySelector('.gradient-bg');
    const scrollPercent = scrolled / (document.documentElement.scrollHeight - window.innerHeight);
    
    if (gradientBg) {
        gradientBg.style.transform = `translateY(${scrolled * 0.4}px)`;
        gradientBg.style.filter = `hue-rotate(${scrollPercent * 40}deg)`;
    }
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Add loading animation to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if (this.tagName === 'BUTTON' || this.getAttribute('href') === '#contact') {
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.animation = 'ripple 0.6s ease-out';
            
            const rect = this.getBoundingClientRect();
            ripple.style.left = (e.clientX - rect.left - 10) + 'px';
            ripple.style.top = (e.clientY - rect.top - 10) + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        }
    });
});

// Add ripple animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(20);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Performance optimization: Throttle scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply throttling to scroll events
const throttledScroll = throttle(() => {
    // Scroll-dependent animations here
}, 100);

window.addEventListener('scroll', throttledScroll);

// Contact form submission handler
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            // Disable button and show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            // Get form data
            const formData = new FormData(contactForm);
            
            try {
                // Add timeout to fetch request
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                const response = await fetch('veritas-contact-handler.php', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                // Parse JSON response (even if status is 400)
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Server did not return JSON');
                }
                
                const result = await response.json();
                
                if (result.success) {
                    // Reset form first
                    contactForm.reset();
                    // Then re-enable button (after form reset)
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit';
                    // Show success message
                    alert(result.message);
                } else if (result.accountExists) {
                    // Account already exists - show message with login option
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit';
                    
                    const userResponse = confirm(result.message + '\n\nWould you like to go to the login page now?');
                    if (userResponse && result.loginUrl) {
                        window.location.href = result.loginUrl;
                    }
                } else {
                    // Re-enable button
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit';
                    // Show validation error message
                    alert(result.message + (result.errors ? '\n- ' + result.errors.join('\n- ') : ''));
                }
            } catch (error) {
                console.error('Form submission error:', error);
                
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                
                if (error.name === 'AbortError') {
                    alert('Request timed out. Please try again or contact us directly at info@veribuilds.com');
                } else {
                    alert('An error occurred while sending your message. Please try again or contact us directly at info@veribuilds.com');
                }
            }
        });
    }
});

// Project carousel functionality
const projects = [
    {
        quote: "They got my bathroom done a few weeks sooner than expected, which is amazing! I will definitely hire Veritas for future projects.",
        author: "— Terri L.",
        tag: "Bathroom Remodel",
        image: "https://roosterconstruction.org/wp-content/uploads/2025/09/RC_PalmSprings_202507-34-scaled.jpg"
    },
    {
        quote: "It is such a relief to find a contractor that you can trust, one that will put your family first. The high quality work is just the icing on the cake.",
        author: "— Gregory Howard",
        tag: "Kitchen Remodel",
        image: "https://roosterconstruction.org/wp-content/uploads/2025/09/RC_PalmSprings_202507-22-scaled.jpg"
    },
    {
        quote: "Veritas did a wonderful job with our bathroom remodel. They created a beautiful bathroom with privacy. The team was super efficient.",
        author: "— Art M.",
        tag: "Home Addition",
        image: "https://roosterconstruction.org/wp-content/uploads/2025/08/RC_PalmSprings_202507-4-scaled.jpg"
    }
];

let currentProjectIndex = 0;

function updateProject(index) {
    const project = projects[index];
    const projectCard = document.querySelector('.project-card');
    const projectImage = document.querySelector('.projects-image');
    
    // Fade out
    projectCard.style.opacity = '0';
    projectCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        // Update content
        document.querySelector('.project-quote').textContent = project.quote;
        document.querySelector('.project-author-name').textContent = project.author;
        document.querySelector('.project-tag').textContent = project.tag;
        projectImage.src = project.image;
        
        // Fade in
        projectCard.style.opacity = '1';
        projectCard.style.transform = 'translateY(0)';
    }, 300);
}

function nextProject() {
    currentProjectIndex = (currentProjectIndex + 1) % projects.length;
    updateProject(currentProjectIndex);
}

function previousProject() {
    currentProjectIndex = (currentProjectIndex - 1 + projects.length) % projects.length;
    updateProject(currentProjectIndex);
}

// Auto-advance carousel every 8 seconds
setInterval(() => {
    nextProject();
}, 8000);

console.log('Veritas Building Group - Modern 2026 Design Loaded');
</script>
</main>
</body>
</html>
