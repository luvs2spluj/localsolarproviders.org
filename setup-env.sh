#!/bin/bash

# Add Supabase environment variables to Vercel
echo "https://qktumtzgbwsprueqqhsr.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "tQw1RTmzurTIYYbg7CnT9Q_3ZiNHEqm" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "d9HHXBKhdcuaKJ1_6bzhbg_eCHDbm67" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Add Clerk environment variables
echo "pk_test_cG9zc2libGUtc2N1bHBpbi0yOS5jbGVyay5hY2NvdW50cy5kZXYk" | npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production

echo "Environment variables added successfully!"
