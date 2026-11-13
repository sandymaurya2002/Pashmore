// Loaded on demand by <LazyMotion> in Providers so the animation engine stays
// out of the initial bundle. domAnimation covers enter/exit, variants and
// whileInView. domMax adds drag and layout projection, which measure the DOM
// on every frame and were only needed for the toast `layout` prop.
import { domAnimation } from 'framer-motion'

export default domAnimation
