import sys
import json
import os
from instagrapi import Client
from instagrapi.exceptions import (
    ClientError,
    UserNotFound,
    LoginRequired,
    ChallengeRequired,
    FeedbackRequired
)
import time
import random

def scrape_instagram(username, count=12):
    cl = Client()
    
    # List of mobile user agents to mimic real devices
    user_agents = [
        "Instagram 219.0.0.12.117 Android (29/10; 480dpi; 1080x2220; samsung; SM-G973F; beyond1; exynos9820; en_GB; 340013233)",
        "Instagram 216.1.0.21.121 Android (30/11; 480dpi; 1080x2220; Xiaomi; Redmi Note 9 Pro; joyeuse; qcom; en_US; 328723456)",
        "Instagram 213.0.0.19.117 Android (28/9; 440dpi; 1080x2150; HUAWEI; VOG-L29; HWVOG; hwp30; en_GB; 310013233)"
    ]
    cl.set_user_agent(random.choice(user_agents))
    
    try:
        # Step 1: Get User ID (Anonymous/Guest attempt)
        try:
            # Try to get user info first, as it sometimes triggers a session or works better
            user_info = cl.user_info_by_username(username)
            user_id = user_info.pk
        except Exception:
            try:
                user_id = cl.user_id_from_username(username)
            except UserNotFound:
                return {"success": False, "error": f"Account @{username} not found.", "type": "not_found"}
            except (LoginRequired, ChallengeRequired, FeedbackRequired) as e:
                return {"success": False, "error": "Instagram requires login for this profile.", "type": "login_required", "hitLoginWall": True}
            except Exception as e:
                return {"success": False, "error": f"Access denied: {str(e)}", "type": "access_denied"}

        # Step 2: Fetch Medias
        try:
            # Try different methods to fetch medias
            try:
                medias = cl.user_medias(user_id, count)
            except Exception:
                # Fallback to a different internal method if user_medias fails
                medias = cl.user_medias_v1(user_id, count)
        except Exception as e:
            medias = []
            print(f"DEBUG: Media fetch failed: {str(e)}", file=sys.stderr)

        posts = []
        for media in medias:
            # Enhanced URL extraction
            url = None
            try:
                if media.media_type == 1: # Image
                    url = str(media.thumbnail_url or (media.image_versions2['candidates'][0]['url'] if 'image_versions2' in media.dict() else None))
                elif media.media_type == 2: # Video/Reel
                    url = str(media.thumbnail_url)
                elif media.media_type == 8: # Album
                    url = str(media.resources[0].thumbnail_url if media.resources else media.thumbnail_url)
            except:
                continue
            
            if not url: continue

            posts.append({
                "url": url,
                "permalink": f"https://www.instagram.com/p/{media.code}/",
                "likes": media.like_count,
                "comments": media.comment_count,
                "caption": media.caption_text or "",
                "timestamp": media.taken_at.isoformat() if media.taken_at else None,
                "type": "video" if media.media_type == 2 else "image"
            })
            
        # Step 3: Fetch User Info
        user_info = None
        try:
            user_info = cl.user_info_by_username(username)
        except:
            pass
        
        return {
            "success": True,
            "username": username,
            "description": user_info.biography if user_info else "",
            "follower_count": user_info.follower_count if user_info else 0,
            "posts": posts,
            "websiteText": (user_info.external_url or user_info.biography) if user_info else "",
            "hitLoginWall": False
        }
    except Exception as e:
        return {
            "success": False, 
            "error": str(e),
            "hitLoginWall": "login" in str(e).lower() or "challenge" in str(e).lower()
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No username provided"}))
        sys.exit(1)
        
    target_username = sys.argv[1].replace('@', '').strip()
    # Randomized delay to prevent instant fingerprinting
    time.sleep(random.uniform(0.3, 1.2))
    result = scrape_instagram(target_username)
    print(json.dumps(result))
