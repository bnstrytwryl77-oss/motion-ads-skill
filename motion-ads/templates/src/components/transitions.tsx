import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

type CircleProps = {x: number; y: number};

// Circle mask expanding from a point (AE "iris" reveal); old scene pushes back slightly
const CircleReveal: React.FC<TransitionPresentationComponentProps<CircleProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{transform: `scale(${1 + presentationProgress * 0.15})`, filter: `blur(${presentationProgress * 8}px)`}}>
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{clipPath: `circle(${presentationProgress * 125}% at ${passedProps.x}% ${passedProps.y}%)`}}>
      {children}
    </AbsoluteFill>
  );
};

export const circleReveal = (props: CircleProps): TransitionPresentation<CircleProps> => ({
  component: CircleReveal,
  props,
});
