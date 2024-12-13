declare module 'react-native-snap-carousel' {
  import { Component } from 'react';
  import { StyleProp, ViewStyle, Animated } from 'react-native';

  export interface CarouselProps<T> {
    data: T[];
    renderItem: (info: { item: T; index: number }) => React.ReactNode;
    sliderWidth: number;
    itemWidth: number;
    inactiveSlideScale?: number;
    inactiveSlideOpacity?: number;
    activeSlideAlignment?: 'center' | 'end' | 'start';
    autoplay?: boolean;
    loop?: boolean;
    autoplayInterval?: number;
    enableMomentum?: boolean;
    lockScrollWhileSnapping?: boolean;
    useScrollView?: boolean;
    style?: StyleProp<ViewStyle>;
  }

  export class Carousel<T> extends Component<CarouselProps<T>> {
    snapToItem: (index: number, animated?: boolean) => void;
    currentIndex: number;
  }

  export default Carousel;
} 