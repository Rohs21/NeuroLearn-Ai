// CSS imports for Next.js
declare module '*.css' {
  const content: any;
  export default content;
}

// Declare all CSS files
declare module '@/app/globals.css' {
  const value: any;
  export default value;
}

declare module '@/components/Hyperspeed.css' {
  const value: any;
  export default value;
}
