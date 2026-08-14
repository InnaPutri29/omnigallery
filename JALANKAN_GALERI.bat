@echo off
title OmniGallery Server & Tunnel Launcher
echo =======================================================
echo 🚀 MENYALAKAN OMNIGALLERY SERVER & CLOUDFLARE TUNNEL...
echo =======================================================
cd /d "d:\Downloads\PROJECT WEB INNA\WEB_PHOTOS"
start "OmniGallery Server" cmd /k "node server.js"
timeout /t 3
start "OmniGallery Cloudflare Tunnel" cmd /k "npm run tunnel"
