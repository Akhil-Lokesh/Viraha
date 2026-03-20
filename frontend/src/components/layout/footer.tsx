import Link from 'next/link';
import { Box, Typography } from '@mui/material';

const productLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

const companyLinks = [
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'text.primary',
        color: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 1152,
          mx: 'auto',
          px: { xs: 2, md: 3 },
          py: 8,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 4,
          }}
        >
          {/* Brand column */}
          <Box sx={{ gridColumn: { xs: 'span 2', md: 'span 1' } }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography
                sx={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-brand)',
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                }}
              >
                Viraha
              </Typography>
            </Link>
            <Typography
              sx={{
                mt: 1.5,
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.6,
                maxWidth: 280,
              }}
            >
              The ache of separation from what you love. Preserve your travel
              memories, map your journeys, share your story.
            </Typography>
          </Box>

          {/* Product */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Product
            </Typography>
            <Box component="ul" sx={{ mt: 2, listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ textDecoration: 'none' }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.6)',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: 'rgba(255,255,255,1)',
                        },
                      }}
                    >
                      {link.label}
                    </Typography>
                  </Link>
                </li>
              ))}
            </Box>
          </Box>

          {/* Company */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Company
            </Typography>
            <Box component="ul" sx={{ mt: 2, listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ textDecoration: 'none' }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.6)',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: 'rgba(255,255,255,1)',
                        },
                      }}
                    >
                      {link.label}
                    </Typography>
                  </Link>
                </li>
              ))}
            </Box>
          </Box>

          {/* Legal */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Legal
            </Typography>
            <Box component="ul" sx={{ mt: 2, listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ textDecoration: 'none' }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.6)',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: 'rgba(255,255,255,1)',
                        },
                      }}
                    >
                      {link.label}
                    </Typography>
                  </Link>
                </li>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Divider and copyright */}
        <Box
          sx={{
            mt: 6,
            borderTop: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            pt: 4,
          }}
        >
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            &copy; {new Date().getFullYear()} Viraha. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
