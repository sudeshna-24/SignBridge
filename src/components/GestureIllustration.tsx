import React from 'react';

interface GestureIllustrationProps {
  id: string;
}

export default function GestureIllustration({ id }: GestureIllustrationProps) {
  // Render coordinate-based vector drawings representing simulated AI landmark skeletons
  // including specific highlights, connector lines, joint nodes, and spatial text guides.
  const renderSvgContent = () => {
    switch (id) {
      case 'hello':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-cyan-400" fill="none" stroke="currentColor">
            {/* Background scanner grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" rx="12" />

            {/* Hand Skeleton Connectors */}
            {/* Palm/Carpal Base */}
            <path d="M100,175 L70,155 L80,125 L100,120 L120,125 L130,135 L100,175" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="3" strokeDasharray="3,3" />
            <path d="M100,175 L80,125" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M100,175 L100,120" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M100,175 L120,125" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />

            {/* Thumb */}
            <path d="M70,155 Q50,140 45,120" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            
            {/* Index */}
            <path d="M80,125 L78,90 L76,65 L75,40" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            
            {/* Middle */}
            <path d="M100,120 L100,85 L100,60 L100,30" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            
            {/* Ring */}
            <path d="M120,125 L122,90 L124,65 L125,44" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            
            {/* Pinky */}
            <path d="M130,135 L135,105 L140,85 L145,60" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />

            {/* Joint Landmarks (Nodes) */}
            {/* Wrist */}
            <circle cx="100" cy="175" r="5" fill="#E879F9" stroke="#fff" strokeWidth="1.5" className="animate-pulse" />
            
            {/* Thumb nodes */}
            <circle cx="70" cy="155" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="50" cy="140" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="45" cy="120" r="4.5" fill="#A5F3FC" stroke="#22D3EE" strokeWidth="1" />
            
            {/* Index nodes */}
            <circle cx="80" cy="125" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="78" cy="90" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="76" cy="65" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="75" cy="40" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />
            
            {/* Middle nodes */}
            <circle cx="100" cy="120" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="100" cy="85" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="100" cy="60" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="100" cy="30" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />
            
            {/* Ring nodes */}
            <circle cx="120" cy="125" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="122" cy="90" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="124" cy="65" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="125" cy="44" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />
            
            {/* Pinky nodes */}
            <circle cx="130" cy="135" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="135" cy="105" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="140" cy="85" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="145" cy="60" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />

            {/* Explanatory Annotations & Guidelines */}
            <g opacity="0.85">
              {/* Point to fingers */}
              <line x1="100" y1="30" x2="160" y2="30" stroke="#E879F9" strokeWidth="1" strokeDasharray="2,2" />
              <text x="165" y="33" fill="#E879F9" className="text-[8px] font-mono font-bold" textAnchor="start">ALL 5 FINGERS UP</text>

              {/* Point to palm */}
              <line x1="85" y1="140" x2="25" y2="140" stroke="#22D3EE" strokeWidth="1" strokeDasharray="2,2" />
              <text x="20" y="143" fill="#22D3EE" className="text-[8px] font-mono font-bold" textAnchor="end">PALM FORWARD</text>

              {/* Center Banner */}
              <rect x="52" y="10" width="96" height="14" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(34, 211, 238, 0.2)" />
              <text x="100" y="20" fill="#fff" className="text-[7.5px] font-bold tracking-widest text-center" textAnchor="middle">GREETING / STOP SIGN</text>
            </g>
          </svg>
        );

      case 'iloveyou':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-cyan-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />
            
            {/* Hand Skeleton Connectors */}
            <path d="M100,175 L70,160 L80,125 L100,120 L120,125 L130,135 L100,175" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="3" strokeDasharray="3,3" />
            <path d="M100,175 L80,125" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M100,175 L100,120" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M100,175 L120,125" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />

            {/* Extended Thumb */}
            <path d="M70,160 L45,150 L20,145" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            
            {/* Extended Index */}
            <path d="M80,125 L75,90 L70,65 L65,40" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            
            {/* Folded Middle */}
            <path d="M100,120 L102,145 L95,152" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="4" strokeLinecap="round" />
            
            {/* Folded Ring */}
            <path d="M120,125 L118,150 L110,156" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="4" strokeLinecap="round" />
            
            {/* Extended Pinky */}
            <path d="M130,135 L140,105 L150,85 L160,55" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />

            {/* Joints */}
            <circle cx="100" cy="175" r="5" fill="#E879F9" stroke="#fff" strokeWidth="1.5" />
            
            {/* Extended nodes (Thumb, Index, Pinky) */}
            <circle cx="45" cy="150" r="4.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="20" cy="145" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />

            <circle cx="75" cy="90" r="4" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
            <circle cx="70" cy="65" r="4" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
            <circle cx="65" cy="40" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />

            <circle cx="140" cy="105" r="4" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
            <circle cx="150" cy="85" r="4" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
            <circle cx="160" cy="55" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />

            {/* Folded nodes indicators */}
            <circle cx="95" cy="152" r="3" fill="#F43F5E" />
            <circle cx="110" cy="156" r="3" fill="#F43F5E" />

            {/* Text Overlay */}
            <g opacity="0.85">
              <line x1="20" y1="145" x2="20" y2="105" stroke="#22D3EE" strokeWidth="1" strokeDasharray="2,2" />
              <text x="20" y="100" fill="#22D3EE" className="text-[8px] font-mono font-bold" textAnchor="start">EXTEND THUMB</text>

              <line x1="102" y1="145" x2="160" y2="145" stroke="#F43F5E" strokeWidth="1" strokeDasharray="2,2" />
              <text x="165" y="148" fill="#F43F5E" className="text-[8px] font-mono font-bold" textAnchor="start">FOLD MIDDLE & RING</text>

              {/* Heart Badge */}
              <rect x="52" y="10" width="96" height="14" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(232, 121, 249, 0.2)" />
              <text x="100" y="20" fill="#F472B6" className="text-[7.5px] font-bold tracking-widest text-center" textAnchor="middle">♥ I LOVE YOU (ILY)</text>
            </g>
          </svg>
        );

      case 'peace':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-cyan-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />
            
            <path d="M100,175 L70,160 L80,125 L100,120 L120,125 L130,135 L100,175" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="3" strokeDasharray="3,3" />
            <path d="M100,175 L80,125" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M100,175 L100,120" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M100,175 L120,125" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />

            {/* Folded Thumb across ring finger */}
            <path d="M70,160 L88,150 L95,145" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="4" strokeLinecap="round" />
            
            {/* Extended Index (V Left) */}
            <path d="M80,125 L70,90 L60,65 L50,40" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            
            {/* Extended Middle (V Right) */}
            <path d="M100,120 L110,85 L120,60 L130,35" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            
            {/* Folded Ring */}
            <path d="M120,125 L118,150 L112,154" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="4" strokeLinecap="round" />
            
            {/* Folded Pinky */}
            <path d="M130,135 L128,155 L120,160" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="4" strokeLinecap="round" />

            {/* Joints */}
            <circle cx="100" cy="175" r="5" fill="#E879F9" stroke="#fff" strokeWidth="1.5" />
            
            {/* V Fingers tips */}
            <circle cx="50" cy="40" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />
            <circle cx="130" cy="35" r="5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />
            
            {/* V joints info */}
            <circle cx="70" cy="90" r="3.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
            <circle cx="60" cy="65" r="3.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
            
            <circle cx="110" cy="85" r="3.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
            <circle cx="120" cy="60" r="3.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />

            {/* Dotted Arch showing V-spread distance */}
            <path d="M50,40 Q90,55 130,35" stroke="#E879F9" strokeWidth="1" strokeDasharray="3,3" />

            {/* Text annotations */}
            <g opacity="0.85">
              <line x1="90" y1="48" x2="90" y2="15" stroke="#E879F9" strokeWidth="1" strokeDasharray="2,2" />
              <text x="90" y="10" fill="#E879F9" className="text-[8px] font-mono font-bold" textAnchor="middle">"V" SHAPE SPREAD</text>

              <line x1="95" y1="145" x2="5" y2="145" stroke="#F43F5E" strokeWidth="1" strokeDasharray="2,2" />
              <text x="5" y="139" fill="#F43F5E" className="text-[8px] font-mono font-bold" textAnchor="start">THUMB FLATTENED OVER</text>

              <rect x="52" y="180" width="96" height="14" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(34, 211, 238, 0.2)" />
              <text x="100" y="190" fill="#fff" className="text-[7.5px] font-bold tracking-widest text-center" textAnchor="middle">PEACE / VICTORY POSE</text>
            </g>
          </svg>
        );

      case 'ok':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-cyan-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />

            <path d="M100,175 L70,160 L80,125 L100,120 L120,125 L130,135 L100,175" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="3" strokeDasharray="3,3" />

            {/* OK Circle: Thumb & Index tips join */}
            {/* Curved Thumb */}
            <path d="M70,160 Q45,145 52,118 L68,102" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            {/* Curved Index joining */}
            <path d="M80,125 Q72,110 68,102" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />

            {/* Splayed Middle */}
            <path d="M100,120 L110,85 L120,55 L130,25" stroke="#E879F9" strokeWidth="4" strokeLinecap="round" />
            
            {/* Splayed Ring */}
            <path d="M120,125 L130,95 L142,70 L155,42" stroke="#E879F9" strokeWidth="4" strokeLinecap="round" />
            
            {/* Splayed Pinky */}
            <path d="M130,135 L145,110 L160,88 L175,65" stroke="#E879F9" strokeWidth="4" strokeLinecap="round" />

            {/* Joint circles */}
            <circle cx="100" cy="175" r="5" fill="#E879F9" stroke="#fff" strokeWidth="1.5" />
            
            {/* Touch Point */}
            <circle cx="68" cy="102" r="6" fill="#10B981" stroke="#fff" strokeWidth="1.5" className="animate-ping" />
            <circle cx="68" cy="102" r="5" fill="#10B981" stroke="#fff" strokeWidth="1.5" />

            {/* Mid, Ring, Pinky Tips */}
            <circle cx="130" cy="25" r="4.5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />
            <circle cx="155" cy="42" r="4.5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />
            <circle cx="175" cy="65" r="4.5" fill="#A5F3FC" stroke="#E879F9" strokeWidth="1" />

            {/* Texts */}
            <g opacity="0.85">
              <line x1="68" y1="102" x2="15" y2="102" stroke="#10B981" strokeWidth="1" strokeDasharray="2,2" />
              <text x="10" y="99" fill="#10B981" className="text-[8px] font-mono font-bold" textAnchor="start">INDEX-THUMB CONTACT</text>

              <line x1="142" y1="70" x2="190" y2="70" stroke="#E879F9" strokeWidth="1" strokeDasharray="2,2" />
              <text x="190" y="80" fill="#E879F9" className="text-[8px] font-mono font-bold" textAnchor="end">SPLAYED OUT FINGERS</text>

              <rect x="52" y="10" width="96" height="14" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(16, 185, 129, 0.2)" />
              <text x="100" y="20" fill="#10B981" className="text-[7.5px] font-bold tracking-widest text-center" textAnchor="middle">OK / PERFECT POSE</text>
            </g>
          </svg>
        );

      case 'thumbsup':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-cyan-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />

            <path d="M100,175 L70,160 L80,140" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="3" />

            {/* Thumb extended straight UP */}
            <path d="M80,140 L75,100 L73,70 L70,35" stroke="#22D3EE" strokeWidth="5.5" strokeLinecap="round" />

            {/* Clenched index, middle, ring, pinky - horizontal tubes folding in */}
            <path d="M100,120 L140,118 L138,135" stroke="rgba(100, 116, 139, 0.8)" strokeWidth="6" strokeLinecap="round" />
            <path d="M100,135 L142,133 L140,148" stroke="rgba(100, 116, 139, 0.8)" strokeWidth="6" strokeLinecap="round" />
            <path d="M100,150 L140,148 L138,161" stroke="rgba(100, 116, 139, 0.8)" strokeWidth="6" strokeLinecap="round" />
            <path d="M100,165 L135,163 L133,174" stroke="rgba(100, 116, 139, 0.8)" strokeWidth="6" strokeLinecap="round" />

            {/* Thumb tip node */}
            <circle cx="70" cy="35" r="5" fill="#E879F9" stroke="#fff" strokeWidth="1.5" className="animate-bounce" />
            <circle cx="73" cy="70" r="4" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
            
            {/* Arrow showing upward posture */}
            <path d="M45,70 L45,40 M40,48 L45,40 L50,48" stroke="#E879F9" strokeWidth="1.5" fill="none" />

            {/* Annotation */}
            <g opacity="0.85">
              <text x="35" y="85" fill="#E879F9" className="text-[8px] font-mono font-bold" textAnchor="start">THUMB UP</text>
              <text x="148" y="140" fill="#94A3B8" className="text-[8px] font-mono font-bold" textAnchor="start">FISTS CLOSED</text>

              <rect x="52" y="180" width="96" height="14" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(34, 211, 238, 0.2)" />
              <text x="100" y="190" fill="#fff" className="text-[7.5px] font-bold tracking-widest text-center" textAnchor="middle">THUMBS UP / CONFIRM</text>
            </g>
          </svg>
        );

      case 'thumbsdown':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-rose-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />

            <path d="M100,25 L70,40 L80,60" stroke="rgba(244, 63, 94, 0.3)" strokeWidth="3" />

            {/* Thumb extended straight DOWN */}
            <path d="M80,60 L75,100 L73,130 L70,165" stroke="#F43F5E" strokeWidth="5.5" strokeLinecap="round" />

            {/* Folded fingers on upper half */}
            <path d="M100,80 L140,82 L138,65" stroke="rgba(100, 116, 139, 0.8)" strokeWidth="6" strokeLinecap="round" />
            <path d="M100,65 L142,67 L140,52" stroke="rgba(100, 116, 139, 0.8)" strokeWidth="6" strokeLinecap="round" />
            <path d="M100,50 L140,52 L138,39" stroke="rgba(100, 116, 139, 0.8)" strokeWidth="6" strokeLinecap="round" />
            <path d="M100,35 L135,37 L133,26" stroke="rgba(100, 116, 139, 0.8)" strokeWidth="6" strokeLinecap="round" />

            {/* Thumb tip node */}
            <circle cx="70" cy="165" r="5" fill="#F43F5E" stroke="#fff" strokeWidth="1.5" className="animate-bounce" />
            
            {/* Arrow showing downward posture */}
            <path d="M45,130 L45,160 M40,152 L45,160 L50,152" stroke="#F43F5E" strokeWidth="1.5" fill="none" />

            {/* Annotation */}
            <g opacity="0.85">
              <text x="35" y="115" fill="#F43F5E" className="text-[8px] font-mono font-bold" textAnchor="start">THUMB DOWN</text>
              <rect x="52" y="10" width="96" height="14" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(244, 63, 94, 0.2)" />
              <text x="100" y="20" fill="#F43F5E" className="text-[7.5px] font-bold tracking-widest text-center" textAnchor="middle">THUMBS DOWN / DISAGREE</text>
            </g>
          </svg>
        );

      case 'fist':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />

            <path d="M100,175 L70,160 L80,140" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="3" />

            {/* Curled parallel fingers forming a grid-fist */}
            <path d="M80,110 L135,110 L128,125" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />
            <path d="M80,125 L138,125 L131,140" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />
            <path d="M80,140 L135,140 L128,155" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />
            <path d="M80,155 L128,155 L120,170" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />

            {/* Thumb clamped horizontally over indices */}
            <path d="M60,115 L68,138 L110,138" stroke="#818CF8" strokeWidth="8.5" strokeLinecap="round" />

            {/* Joints of thumb clamping */}
            <circle cx="68" cy="138" r="4.5" fill="#A5F3FC" stroke="#4338CA" strokeWidth="1" />
            <circle cx="110" cy="138" r="4.5" fill="#A5F3FC" stroke="#4338CA" strokeWidth="1" />

            <g opacity="0.85">
              <line x1="110" y1="138" x2="165" y2="138" stroke="#818CF8" strokeWidth="1" strokeDasharray="2,2" />
              <text x="170" y="141" fill="#818CF8" className="text-[8px] font-mono font-bold" textAnchor="start">THUMB CLAMPED</text>
              <text x="100" y="25" fill="#fff" className="text-[10px] font-mono text-center" textAnchor="middle">YES / SOLIDARITY</text>
            </g>
          </svg>
        );

      case 'gesture-a':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />

            <path d="M100,175 L70,165" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="3" />

            {/* Standard Alphabet A closed fist */}
            <path d="M85,115 L130,115" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />
            <path d="M85,128 L130,128" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />
            <path d="M85,140 L130,140" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />
            <path d="M85,152 L125,152" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />

            {/* Vertical thumb hugging index side */}
            <path d="M70,165 L68,135 L68,105" stroke="#E879F9" strokeWidth="8" strokeLinecap="round" />

            {/* Thumb tip */}
            <circle cx="68" cy="105" r="4.5" fill="#A5F3FC" stroke="#fff" strokeWidth="1" />

            <g opacity="0.85">
              <line x1="68" y1="105" x2="135" y2="105" stroke="#E879F9" strokeWidth="1" strokeDasharray="2,2" />
              <text x="140" y="108" fill="#E879F9" className="text-[8px] font-mono font-bold" textAnchor="start">THUMB PARALLEL</text>
              <text x="100" y="25" fill="#fff" className="text-[11px] font-heading font-extrabold text-center" textAnchor="middle">ASL LETTER "A"</text>
            </g>
          </svg>
        );

      case 'gesture-b':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />

            <path d="M100,175 L80,145" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="3" />

            {/* Standard Alphabet B flat open palm */}
            {/* Quad fingers upright splayed tight */}
            <path d="M85,145 L85,55" stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
            <path d="M96,145 L96,48" stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
            <path d="M107,145 L107,51" stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
            <path d="M118,145 L118,60" stroke="#10B981" strokeWidth="7" strokeLinecap="round" />

            {/* Thumb bent folded diagonally over palm front */}
            <path d="M68,165 L76,142 L98,132" stroke="#F59E0B" strokeWidth="6.5" strokeLinecap="round" />

            {/* Thumb end node */}
            <circle cx="98" cy="132" r="4" fill="#FEF3C7" stroke="#FEF3C7" strokeWidth="1" />

            <g opacity="0.85">
              <path d="M82,45 L121,45" stroke="#10B981" strokeWidth="1.5" strokeDasharray="2,2" />
              <text x="100" y="32" fill="#10B981" className="text-[8px] font-mono font-bold" textAnchor="middle">4 FINGERS EXTENDED & TIGHT</text>
              <text x="106" y="125" fill="#F59E0B" className="text-[8.5px] font-mono font-bold" textAnchor="start">THUMB FOLDED</text>
              <rect x="52" y="178" width="96" height="14" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(16, 185, 129, 0.2)" />
              <text x="100" y="188" fill="#10B981" className="text-[7.5px] font-bold tracking-widest text-center" textAnchor="middle">ASL LETTER "B"</text>
            </g>
          </svg>
        );

      case 'gesture-c':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-400" fill="none" stroke="currentColor">
            <rect width="100%" height="100%" rx="12" fill="url(#grid)" />

            {/* Alphabet C: semi-circle curve of fingers and thumb */}
            <path d="M140,55 C90,50 65,85 65,115 C65,145 90,170 140,168" stroke="#818CF8" strokeWidth="10" strokeLinecap="round" />

            {/* Thumb in opposite crescent curve */}
            <path d="M100,165 C115,160 128,155 138,154" stroke="#818CF8" strokeWidth="8" strokeLinecap="round" />

            {/* Guide curve line overlay */}
            <path d="M132,65 Q102,98 132,142" stroke="rgba(232, 121, 249, 0.5)" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />

            <g opacity="0.85">
              <text x="50" y="115" fill="#818CF8" className="text-[8px] font-mono font-bold" textAnchor="middle" transform="rotate(-90, 50, 115)">"C" SEMICIRCLE ARCH</text>
              <text x="100" y="25" fill="#fff" className="text-[11px] font-heading font-extrabold text-center" textAnchor="middle">ASL LETTER "C"</text>
            </g>
          </svg>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-slate-950/40 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500">Vector representation loading...</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full aspect-square max-w-[200px] mx-auto bg-slate-950/25 rounded-2xl border border-white/5 shadow-inner p-2 relative flex items-center justify-center">
      {renderSvgContent()}
    </div>
  );
}
