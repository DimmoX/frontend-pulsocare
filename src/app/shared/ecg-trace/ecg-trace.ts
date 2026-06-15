import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ecg-trace',
  template: `
    <svg
      [class]="'block w-full h-full overflow-visible ' + className()"
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        class="ecg-trace__line"
        d="M0,60 L60,60 L80,60 L95,20 L110,100 L125,40 L140,60 L200,60
           L260,60 L280,60 L295,20 L310,100 L325,40 L340,60 L400,60
           L460,60 L480,60 L495,20 L510,100 L525,40 L540,60 L600,60"
        fill="none"
        [attr.stroke]="color()"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  styles: `
    .ecg-trace__line {
      stroke-dasharray: 1400;
      stroke-dashoffset: 1400;
      animation: ecg-draw 3.2s linear infinite;
    }

    @keyframes ecg-draw {
      0% { stroke-dashoffset: 1400; }
      60% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -40; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ecg-trace__line {
        animation: none;
        stroke-dashoffset: 0;
      }
    }
  `,
})
export class EcgTrace {
  color = input<string>('currentColor');
  className = input<string>('');
}
