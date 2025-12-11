'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Sparkles, Palette, Focus, ArrowUpCircle } from 'lucide-react'

export interface PostProcessSettings {
  autoEnhance: boolean
  colorCorrection: {
    enabled: boolean
    saturation: number
    brightness: number
    contrast: number
  }
  sharpen: {
    enabled: boolean
    strength: 'light' | 'medium' | 'strong'
  }
  upscale: {
    enabled: boolean
    scale: 2 | 4
  }
}

interface PostProcessPanelProps {
  settings: PostProcessSettings
  onChange: (settings: PostProcessSettings) => void
}

export function PostProcessPanel({ settings, onChange }: PostProcessPanelProps) {
  const updateSettings = (updates: Partial<PostProcessSettings>) => {
    onChange({ ...settings, ...updates })
  }

  const applyPreset = (preset: 'none' | 'quick' | 'high-quality' | 'print-ready') => {
    switch (preset) {
      case 'none':
        onChange({
          autoEnhance: false,
          colorCorrection: { enabled: false, saturation: 1, brightness: 1, contrast: 1 },
          sharpen: { enabled: false, strength: 'medium' },
          upscale: { enabled: false, scale: 2 }
        })
        break
      case 'quick':
        onChange({
          autoEnhance: true,
          colorCorrection: { enabled: false, saturation: 1, brightness: 1, contrast: 1 },
          sharpen: { enabled: true, strength: 'light' },
          upscale: { enabled: false, scale: 2 }
        })
        break
      case 'high-quality':
        onChange({
          autoEnhance: true,
          colorCorrection: { enabled: true, saturation: 1.1, brightness: 1, contrast: 1.05 },
          sharpen: { enabled: true, strength: 'medium' },
          upscale: { enabled: true, scale: 2 }
        })
        break
      case 'print-ready':
        onChange({
          autoEnhance: true,
          colorCorrection: { enabled: true, saturation: 1.15, brightness: 1, contrast: 1.1 },
          sharpen: { enabled: true, strength: 'strong' },
          upscale: { enabled: true, scale: 4 }
        })
        break
    }
  }

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div className="space-y-2">
        <Label className="text-xs text-foreground">Quick Presets</Label>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => applyPreset('none')}>
            None
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset('quick')}>
            Quick
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset('high-quality')}>
            HQ
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset('print-ready')}>
            Print
          </Button>
        </div>
      </div>

      {/* Auto Enhance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-foreground" />
          <Label className="text-foreground">Auto Enhance</Label>
        </div>
        <Switch
          checked={settings.autoEnhance}
          onCheckedChange={(checked) => updateSettings({ autoEnhance: checked })}
        />
      </div>

      {/* Color Correction */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-foreground" />
            <Label className="text-foreground">Color Correction</Label>
          </div>
          <Switch
            checked={settings.colorCorrection.enabled}
            onCheckedChange={(checked) =>
              updateSettings({
                colorCorrection: { ...settings.colorCorrection, enabled: checked }
              })
            }
          />
        </div>
        {settings.colorCorrection.enabled && (
          <div className="pl-6 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-foreground">
                <span>Saturation</span>
                <span>{Math.round(settings.colorCorrection.saturation * 100)}%</span>
              </div>
              <Slider
                value={[settings.colorCorrection.saturation]}
                min={0.5}
                max={1.5}
                step={0.05}
                onValueChange={([value]) =>
                  updateSettings({
                    colorCorrection: { ...settings.colorCorrection, saturation: value }
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-foreground">
                <span>Brightness</span>
                <span>{Math.round(settings.colorCorrection.brightness * 100)}%</span>
              </div>
              <Slider
                value={[settings.colorCorrection.brightness]}
                min={0.5}
                max={1.5}
                step={0.05}
                onValueChange={([value]) =>
                  updateSettings({
                    colorCorrection: { ...settings.colorCorrection, brightness: value }
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-foreground">
                <span>Contrast</span>
                <span>{Math.round(settings.colorCorrection.contrast * 100)}%</span>
              </div>
              <Slider
                value={[settings.colorCorrection.contrast]}
                min={0.5}
                max={1.5}
                step={0.05}
                onValueChange={([value]) =>
                  updateSettings({
                    colorCorrection: { ...settings.colorCorrection, contrast: value }
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Sharpen */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="w-4 h-4 text-foreground" />
            <Label className="text-foreground">Sharpen</Label>
          </div>
          <Switch
            checked={settings.sharpen.enabled}
            onCheckedChange={(checked) =>
              updateSettings({
                sharpen: { ...settings.sharpen, enabled: checked }
              })
            }
          />
        </div>
        {settings.sharpen.enabled && (
          <div className="pl-6 flex gap-2">
            {(['light', 'medium', 'strong'] as const).map((strength) => (
              <Button
                key={strength}
                size="sm"
                variant={settings.sharpen.strength === strength ? 'default' : 'outline'}
                onClick={() =>
                  updateSettings({
                    sharpen: { ...settings.sharpen, strength }
                  })
                }
              >
                {strength.charAt(0).toUpperCase() + strength.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Upscale */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-foreground" />
            <Label className="text-foreground">Upscale</Label>
          </div>
          <Switch
            checked={settings.upscale.enabled}
            onCheckedChange={(checked) =>
              updateSettings({
                upscale: { ...settings.upscale, enabled: checked }
              })
            }
          />
        </div>
        {settings.upscale.enabled && (
          <div className="pl-6 flex gap-2">
            <Button
              size="sm"
              variant={settings.upscale.scale === 2 ? 'default' : 'outline'}
              onClick={() =>
                updateSettings({
                  upscale: { ...settings.upscale, scale: 2 }
                })
              }
            >
              2x
            </Button>
            <Button
              size="sm"
              variant={settings.upscale.scale === 4 ? 'default' : 'outline'}
              onClick={() =>
                updateSettings({
                  upscale: { ...settings.upscale, scale: 4 }
                })
              }
            >
              4x
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Default settings
export const defaultPostProcessSettings: PostProcessSettings = {
  autoEnhance: false,
  colorCorrection: {
    enabled: false,
    saturation: 1,
    brightness: 1,
    contrast: 1
  },
  sharpen: {
    enabled: false,
    strength: 'medium'
  },
  upscale: {
    enabled: false,
    scale: 2
  }
}
