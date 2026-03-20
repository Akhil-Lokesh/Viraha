'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#D4A843';

// Realistic continent silhouettes — simplified Mercator projection (viewBox: 0 0 1010 700)
const CONTINENT_PATHS: Record<string, string> = {
  AF: 'M618.6,430.4L599,434.1L585.4,418.5L565.9,376.5L570.4,383.2L571.3,371.8L535.7,366.4L528.8,374.9L504.3,363.3L501.9,351L458.6,356.6L427.7,400.9L428.7,429.3L450,450L487.4,445.9L501.6,453L500,466.5L513.7,493.5L508.3,514.6L530.3,567.1L552.3,561.7L565.6,547.1L575.1,531.4L572.8,519.7L589.6,504.8L585.2,476.4L618.6,430.4ZM616.1,505L602.6,537.2L599.9,509.2L613.2,497.2L616.1,505Z',
  AS: 'M647.7,391.2L609.8,375.8L620.5,394.4L633.3,387.1L642.9,399.6L630.2,414.7L597.2,427.9L572.4,381.9L575.9,357.7L600.8,351.6L600.8,342.6L626.2,352.4L623.1,341.4L628.8,338L616.4,324.1L624,315.1L611.6,316.3L606.4,304.6L617.6,294.4L647.3,298.3L642.5,282.2L632.6,277.1L639.9,273.5L647,227L666.7,206.5L662.3,177L669.3,160.5L678.8,161.2L678.4,214.4L685.7,203L684.6,160.6L689.4,175.9L692.8,165.9L703.8,170.6L701,152.7L718.7,149.8L719.7,137.4L757.8,122.4L767.9,106.5L776,121.8L786.7,119.1L795.3,129.2L782,147.3L809,157.9L831.3,153.6L843.4,179L846.1,169.9L867.5,173L869.2,160.5L894.5,166.6L904.2,178.6L921.1,178.3L926.5,190.2L945.9,189L950.7,196L953.2,184.8L968,186.6L995.8,213.3L1002.8,209.2L1008.5,215.8L999.9,227.3L980.4,216.5L972.9,225L978,239.4L953,253.4L934,253.5L930,279.6L915.1,297.4L912.6,270L936.6,237.9L924.4,249.7L922.1,242.6L914.9,244.6L910.2,257.5L874.2,258.1L854.3,280.2L871.8,288L868.2,308.5L833,342.4L837.4,358.9L830.1,361.2L826.8,343.1L814.8,345.5L816.5,338L806.4,344.4L818.5,350.6L809.5,359.4L816.6,381.3L800.3,398.2L772.3,407.2L781.9,425.6L770.2,439.3L756,425.7L753.6,437.5L767.6,459.8L751.1,441.6L747.8,415.5L739.4,418.1L731.7,398.2L700.6,418.5L692.8,441.1L679,402.5L661.4,390.1L647.7,391.2Z',
  EU: 'M657.2,191.8L645,186.8L643.3,199.2L625.2,199.7L625.9,194.7L605.2,210.9L604.9,199.4L597.1,196.9L598.5,215.1L593.3,212.3L586.3,225.5L579.5,221.4L579,229.8L568.3,211.2L587.5,213.8L588.2,201.8L562.5,189.2L554.2,175.6L529.1,187.1L489.3,241.3L491.2,260.5L504.3,255.7L511.6,277L519.8,273.3L525.3,236.6L542.3,215.5L546.5,221.6L535.7,233.9L535.1,248.6L556.9,252.6L540.7,257.2L542.9,268.7L535.8,266.7L530.4,281.6L505.9,283.6L504.9,265L499.2,268.2L498.1,285.8L462.4,307.4L471.9,318.4L469.9,328.6L448.9,330.1L450.3,352.6L469.3,353.3L484,330L500.2,325L520.4,348.7L527.1,340.9L512.1,319.6L540.2,354.2L538.7,340.5L556.1,337.6L561.5,316.2L570.3,325L585,313.4L578.2,321.5L591.8,335.8L557.3,337L548.7,343.4L552.8,353.4L599.5,352.2L600.9,342.5L612.4,347.5L608.7,299.8L648,296.2L632.6,277.1L639.9,273.4L647,227L666.8,206.4L657.2,191.8Z',
  NA: 'M305.8,317.4L292,328.2L294.6,321.4L278.7,327.7L262.3,351.5L261.2,344.6L262.9,357.2L247.2,371L249.9,390.8L233,374.4L202.3,384L206.4,410L231.2,401.9L225.9,418.5L241.4,420.3L244.7,438.2L258.4,439.1L248.5,443.2L229.9,426L180.9,408.5L153.4,369.8L168.4,397L152.7,382.9L126.5,340.4L130.8,306.2L117.9,298.2L99.3,263L62.8,247.8L49.9,257.4L52.9,245.4L31,274L13.2,281.8L34.9,258.8L21.1,260.1L11.6,250L10.6,240.8L24.5,223.8L12.7,226L3.9,217.9L21.9,214.9L9.2,194.6L36.2,174.2L92.5,194.5L116,181.6L122.7,189.9L126.4,184.4L126.8,190.5L152.1,194.4L157,203.6L170,205.9L177.6,195.2L190.8,203.9L201.4,196.9L205.7,206.5L211,193.1L205,175.6L212,170.6L230.3,207.2L235.5,186.6L247.3,192.4L247.4,204.3L214,241.1L209.7,258.6L216.4,268.4L244.5,278.2L251.1,296.6L251.4,280.5L260.6,271.3L256.2,239.3L280.1,246.8L285.5,262.6L294.1,251L319.1,292.4L289,300.9L275.8,315.3L292.8,305.2L294.4,317.7L305.8,317.4Z',
  SA: 'M377.4,482.2L334,463.6L331.4,451.7L301.7,433.4L279.1,429.2L274.2,438L274.1,428.5L258,439.6L247.4,480.5L278.5,519.6L266.8,597.3L271.3,594.1L263.1,610.8L271.8,640.9L284.2,635.4L291.2,613.2L286.5,606.4L297.3,594.8L292.6,589.1L313.3,578.7L311.4,563.9L324.3,565.6L341.6,535L360.4,526.1L377.4,482.2Z',
  OC: 'M904.7,540.5L874.8,493.3L868.4,513.5L855.2,505.6L857.9,496.6L846.3,494.6L838.7,505.5L827.6,503.4L814.1,519.3L795.3,525.5L793.2,533.5L802.3,567.7L843.5,555.9L856.6,567.3L861.7,560.6L858.9,568.5L869.6,578.1L885.5,581.7L895.9,576L904.7,540.5Z',
  AN: 'M1009.4,700L1009.4,668L999.9,669L995.7,675L991.6,669L987.6,674L982.6,669L980.1,680L968.7,669L961,674L950.2,665L923.3,630L928.8,618L943.5,615L933.9,598L955.3,570L892.6,558L883.2,553L860.6,553L854,547L853.1,550L811.2,554L793.7,549L772.9,553L763.5,548L754.8,554L743.8,555L721.9,550L682.3,565L671.1,577L665.7,574L668.3,560L647.4,560L628.1,549L583.5,566L570.1,559L551.1,568L512.7,565L505.4,569L496.8,565L474.4,573L446.2,571L425.9,590L376,605L375.2,613L391.9,611L395.1,620L360.8,630L355.1,638L335.6,634L311.9,650L307.7,642L263.8,625L256.4,614L256.6,608L268.6,604L258.5,597L277.2,596L303,580L302.6,568L291,555L313,538L285.2,552L284.6,577L265.1,583L250,578L246.7,583L224.9,576L222.5,580L205,582L184.4,577L192.9,595L160.3,592L155.6,587L135.7,592L96,591L65.3,596L65.6,604L50.9,610L31.2,607L39.7,622L63.7,629L52.9,643L35.5,641L46.7,652L44.6,665L54.5,674L74.6,678L74,684L58.8,694L40.1,688L32.1,693L0,668L0,700L1009.4,700Z',
};

const CONTINENTS = [
  { name: 'Asia', abbr: 'AS', visited: true },
  { name: 'Europe', abbr: 'EU', visited: true },
  { name: 'N. America', abbr: 'NA', visited: true },
  { name: 'S. America', abbr: 'SA', visited: false },
  { name: 'Africa', abbr: 'AF', visited: false },
  { name: 'Oceania', abbr: 'OC', visited: false },
  { name: 'Antarctica', abbr: 'AN', visited: false },
];

const visitedCount = CONTINENTS.filter((c) => c.visited).length;

// Grid lines for map background
function MapGrid({ color }: { color: string }) {
  const lines = [];
  for (let i = 0; i <= 10; i++) {
    lines.push(
      <line key={`h${i}`} x1="0" y1={i * 70} x2="1010" y2={i * 70} stroke={color} strokeWidth="0.5" />,
      <line key={`v${i}`} x1={i * 101} y1="0" x2={i * 101} y2="700" stroke={color} strokeWidth="0.5" />,
    );
  }
  return <>{lines}</>;
}

export function ContinentProgressWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';
  const isCompact = size.cols <= 2 && size.rows <= 1;
  const isBanner = size.cols >= 4 && size.rows <= 1;
  const isMedium = size.cols <= 2 && size.rows >= 2;

  // 2×1 compact — dot indicators
  if (isCompact) {
    return (
      <Box
        sx={{
          bgcolor: c.bgTint,
          borderRadius: '16px',
          p: 2,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
          {CONTINENTS.map((cont) => (
            <Box
              key={cont.abbr}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: cont.visited ? c.accent : 'transparent',
                border: cont.visited ? 'none' : '2px solid',
                borderColor: cont.visited ? undefined : 'action.disabled',
              }}
            />
          ))}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: c.accent, whiteSpace: 'nowrap' }}>
          {visitedCount}/7
        </Typography>
      </Box>
    );
  }

  // All larger sizes — world map with continent fills
  const gridLineColor = isDark ? alpha('#fff', 0.04) : alpha('#000', 0.04);
  const unvisitedFill = isDark ? alpha('#fff', 0.08) : alpha('#000', 0.06);

  return (
    <Box
      sx={{
        bgcolor: isDark ? alpha(hex, 0.08) : alpha(hex, 0.03),
        borderRadius: '16px',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pt: 1.5,
          pb: 0.5,
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: c.accent,
            textTransform: 'uppercase',
          }}
        >
          Continents
        </Typography>
        <Typography sx={{ fontSize: isBanner ? '1rem' : '1.25rem', fontWeight: 800, color: c.accent, lineHeight: 1 }}>
          {visitedCount}<Typography component="span" sx={{ fontSize: '0.7em', color: 'text.secondary', fontWeight: 500 }}>/7</Typography>
        </Typography>
      </Box>

      {/* Map area */}
      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Box
          component="svg"
          viewBox={isBanner ? '0 100 1010 400' : '0 50 1010 600'}
          preserveAspectRatio="xMidYMid meet"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {/* Grid lines */}
          <MapGrid color={gridLineColor} />

          {/* Continent shapes */}
          {CONTINENTS.map((cont) => (
            <path
              key={cont.abbr}
              d={CONTINENT_PATHS[cont.abbr]}
              fill={cont.visited ? c.accent : unvisitedFill}
              style={{
                transition: 'fill 0.3s, filter 0.3s',
                filter: cont.visited ? `drop-shadow(0 0 8px ${alpha(hex, 0.4)})` : 'none',
              }}
            />
          ))}

          {/* Visited markers — small dots on visited continents */}
          {CONTINENTS.filter((ct) => ct.visited).map((cont) => {
            const markers: Record<string, [number, number][]> = {
              AS: [[750, 180], [690, 280], [830, 350]],
              EU: [[540, 250], [580, 310]],
              NA: [[200, 300], [120, 260], [260, 370]],
            };
            return (markers[cont.abbr] || []).map(([cx, cy], i) => (
              <circle
                key={`${cont.abbr}-${i}`}
                cx={cx}
                cy={cy}
                r="4"
                fill="white"
                stroke={c.accent}
                strokeWidth="2"
              />
            ));
          })}
        </Box>
      </Box>

      {/* Bottom: continent name chips — only for medium/large sizes */}
      {!isBanner && (
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            px: 1.5,
            pb: 1.5,
            pt: 0.5,
            flexWrap: 'wrap',
            justifyContent: 'center',
            zIndex: 2,
            flexShrink: 0,
          }}
        >
          {CONTINENTS.filter(ct => ct.abbr !== 'AN').map((cont) => (
            <Box
              key={cont.abbr}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '8px',
                bgcolor: cont.visited ? alpha(hex, isDark ? 0.25 : 0.12) : 'transparent',
                border: cont.visited ? 'none' : '1px solid',
                borderColor: cont.visited ? undefined : isDark ? alpha('#fff', 0.1) : alpha('#000', 0.08),
              }}
            >
              <Typography
                sx={{
                  fontSize: isMedium ? '9px' : '10px',
                  fontWeight: cont.visited ? 700 : 400,
                  color: cont.visited ? c.accent : 'text.disabled',
                  whiteSpace: 'nowrap',
                }}
              >
                {cont.name}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
