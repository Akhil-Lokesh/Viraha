import { describe, it, expect } from 'vitest';
import {
  fadeIn, fadeInUp, fadeInDown, scaleIn,
  slideInLeft, slideInRight,
  staggerContainer, staggerItem,
  cardHover, imageZoom, pageTransition,
  counterAnimation, widgetEditShake, widgetDragOverlay,
  easeOutQuart, easeNative,
} from '../../lib/animations';

describe('Animation variants', () => {
  it('fadeIn should have hidden and visible states', () => {
    expect(fadeIn.hidden).toHaveProperty('opacity', 0);
    expect(fadeIn.visible).toHaveProperty('opacity', 1);
  });

  it('fadeInUp should translate Y from 12 to 0', () => {
    expect(fadeInUp.hidden).toHaveProperty('y', 12);
    expect(fadeInUp.visible).toHaveProperty('y', 0);
  });

  it('fadeInDown should translate Y from -8 to 0', () => {
    expect(fadeInDown.hidden).toHaveProperty('y', -8);
    expect(fadeInDown.visible).toHaveProperty('y', 0);
  });

  it('scaleIn should scale from 0.97 to 1', () => {
    expect(scaleIn.hidden).toHaveProperty('scale', 0.97);
    expect(scaleIn.visible).toHaveProperty('scale', 1);
  });

  it('slideInLeft should translate X from -16 to 0', () => {
    expect(slideInLeft.hidden).toHaveProperty('x', -16);
    expect(slideInLeft.visible).toHaveProperty('x', 0);
  });

  it('slideInRight should translate X from 16 to 0', () => {
    expect(slideInRight.hidden).toHaveProperty('x', 16);
    expect(slideInRight.visible).toHaveProperty('x', 0);
  });

  it('staggerContainer should have staggerChildren', () => {
    const visible = staggerContainer.visible as Record<string, unknown>;
    const transition = visible.transition as Record<string, number>;
    expect(transition.staggerChildren).toBeGreaterThan(0);
  });

  it('staggerItem should fade and translate', () => {
    expect(staggerItem.hidden).toHaveProperty('opacity', 0);
    expect(staggerItem.hidden).toHaveProperty('y', 10);
  });

  it('cardHover should scale on hover', () => {
    expect(cardHover.rest).toHaveProperty('scale', 1);
    expect(cardHover.hover).toHaveProperty('scale', 1.02);
  });

  it('imageZoom should scale on hover', () => {
    expect(imageZoom.rest).toHaveProperty('scale', 1);
    expect(imageZoom.hover).toHaveProperty('scale', 1.05);
  });

  it('pageTransition should have initial, animate, and exit', () => {
    expect(pageTransition.initial).toBeDefined();
    expect(pageTransition.animate).toBeDefined();
    expect(pageTransition.exit).toBeDefined();
  });

  it('counterAnimation should fade in', () => {
    expect(counterAnimation.hidden).toHaveProperty('opacity', 0);
    expect(counterAnimation.visible).toHaveProperty('opacity', 1);
  });

  it('widgetEditShake should rotate', () => {
    const shake = widgetEditShake.shake as Record<string, unknown>;
    expect(shake.rotate).toBeDefined();
  });

  it('widgetDragOverlay should scale when dragging', () => {
    expect(widgetDragOverlay.dragging).toHaveProperty('scale', 1.05);
  });

  it('easing arrays should have 4 values', () => {
    expect(easeOutQuart).toHaveLength(4);
    expect(easeNative).toHaveLength(4);
  });
});
