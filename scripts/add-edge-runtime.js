const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/auth/otp/route.ts',
  'src/app/api/auth/register/verify/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/centro-motero/ads/analytics/route.ts',
  'src/app/api/centro-motero/ads/click/route.ts',
  'src/app/api/centro-motero/ads/route.ts',
  'src/app/api/centro-motero/challenges/route.ts',
  'src/app/api/centro-motero/convoy/route.ts',
  'src/app/api/centro-motero/marketplace/route.ts',
  'src/app/api/centro-motero/rescue/route.ts',
  'src/app/api/centro-motero/restrictions/route.ts',
  'src/app/api/chat/conversations/route.ts',
  'src/app/api/chat/messages/route.ts',
  'src/app/api/posts/[postId]/comments/route.ts',
  'src/app/api/posts/[postId]/edit/route.ts',
  'src/app/api/posts/[postId]/like/route.ts',
  'src/app/api/posts/route.ts',
  'src/app/api/profile/discover/route.ts',
  'src/app/api/profile/follow/route.ts',
  'src/app/api/profile/motos/[id]/route.ts',
  'src/app/api/profile/motos/route.ts',
  'src/app/api/profile/status/route.ts',
  'src/app/api/profile/stories/route.ts',
  'src/app/api/profile/route.ts',
  'src/app/api/upload/route.ts',
  'src/app/(main)/perfil/[username]/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('export const runtime')) {
      content = `export const runtime = "edge";\n\n` + content;
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Added edge runtime to ${file}`);
    } else {
      console.log(`Skipped ${file} (already contains runtime definition)`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
