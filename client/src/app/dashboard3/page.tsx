'use client';

import React from 'react';
import DashboardPlayground from '../components/DashboardPlayground';

// Dashboard 3 - London Numbers Style Dashboard
const Dashboard3: React.FC = () => {
  return (
    <DashboardPlayground
      isActive={true}
      dashboardTitle="London Numbers Dashboard"
      dashboardType="london-style"
    >
      <div className="london-dashboard" style={{
        width: '1600px',
        height: '1200px',
        backgroundColor: '#0a0a0a',
        color: 'white',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #333'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '300',
              letterSpacing: '0.1em',
              margin: 0,
              color: '#fff'
            }}>
              LONDON IN <span style={{ 
                background: 'linear-gradient(45deg, #8B5CF6, #A855F7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '600'
              }}>NUMBERS
              </span>
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#888',
              margin: '5px 0 0 0',
              fontWeight: '300'
            }}>
              Data Driven Insights for the Capital City - One Borough at a Time
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              textAlign: 'right'
            }}>
              Charts based on data from the<br />
              <strong>2021</strong> census, where applicable
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#333',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>💬</div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#333',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>📄</div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#333',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>❓</div>
          </div>
        </div>

        {/* Grid Container */}
        <div style={{
          position: 'absolute',
          top: '120px',
          left: '20px',
          right: '20px',
          bottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(7, 1fr)',
          gap: '15px'
        }}>
          
          {/* Row 1: KPI Indicators (1x1 each) */}
          {/* Borough Details */}
          <div style={{
            gridColumn: '1 / 2',
            gridRow: '1 / 2',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px' }}>SELECTED BOROUGH</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Hillingdon</div>
          </div>

          {/* Total Population */}
          <div style={{
            gridColumn: '2 / 3',
            gridRow: '1 / 2',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>324,091</div>
            <div style={{ fontSize: '10px', color: '#888' }}>Borough Total Population</div>
          </div>

          {/* Population Change */}
          <div style={{
            gridColumn: '3 / 4',
            gridRow: '1 / 2',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#10B981', fontSize: '18px' }}>↗</span>
              <span style={{ fontSize: '20px', fontWeight: '600', color: '#10B981' }}>+ 14.8%</span>
            </div>
            <div style={{ fontSize: '10px', color: '#888' }}>Population Difference from 2011</div>
          </div>

          {/* Population Density */}
          <div style={{
            gridColumn: '4 / 5',
            gridRow: '1 / 2',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>48.1</div>
            <div style={{ fontSize: '10px', color: '#888' }}>Population Density (per 10,000 m²)</div>
          </div>

          {/* Mean House Price */}
          <div style={{
            gridColumn: '5 / 6',
            gridRow: '1 / 2',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>£516,266</div>
            <div style={{ fontSize: '10px', color: '#888' }}>Mean House Price</div>
          </div>

          {/* Mean Household Income */}
          <div style={{
            gridColumn: '6 / 7',
            gridRow: '1 / 2',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>£42,132</div>
            <div style={{ fontSize: '10px', color: '#888' }}>Mean Household Income</div>
          </div>

          {/* Map Controls */}
          <div style={{
            gridColumn: '7 / 8',
            gridRow: '1 / 2',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>MAP DISPLAY</div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <button style={{
                background: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '9px',
                cursor: 'pointer'
              }}>Population</button>
              <button style={{
                background: '#333',
                color: '#888',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '9px',
                cursor: 'pointer'
              }}>House Prices</button>
              <button style={{
                background: '#333',
                color: '#888',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '9px',
                cursor: 'pointer'
              }}>Car Ownership</button>
              <button style={{
                background: '#333',
                color: '#888',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '9px',
                cursor: 'pointer'
              }}>Deprivation</button>
            </div>
          </div>

          {/* Profile Icon */}
          <div style={{
            gridColumn: '8 / 9',
            gridRow: '1 / 2',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px' }}>PROFILE</div>
            <div style={{
              display: 'flex',
              gap: '5px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#333',
                borderRadius: '50%'
              }}></div>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#333',
                borderRadius: '50%'
              }}></div>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#333',
                borderRadius: '50%'
              }}></div>
            </div>
          </div>

          {/* Row 2: Large Map (4x4) + Right Side Charts (2x2 each) */}
          {/* LSOA Level Borough Map */}
          <div style={{
            gridColumn: '1 / 5',
            gridRow: '2 / 6',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #333',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '20px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff'
            }}>
              LSOA LEVEL BOROUGH MAP | POPULATION DENSITY
            </div>
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '20px',
              fontSize: '10px',
              color: '#888'
            }}>
              (Click to filter dashboard)
            </div>
            
            {/* Map Content */}
            <div style={{
              position: 'absolute',
              top: '50px',
              left: '20px',
              right: '20px',
              bottom: '80px',
              background: 'linear-gradient(135deg, #1e1e2e 0%, #2d1b69 50%, #8B5CF6 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Simulated borough shapes */}
              <div style={{
                position: 'absolute',
                width: '200px',
                height: '150px',
                background: 'rgba(139, 92, 246, 0.8)',
                borderRadius: '20px 40px 30px 50px',
                top: '30px',
                left: '50px',
                border: '2px solid rgba(255,255,255,0.3)'
              }}></div>
              <div style={{
                position: 'absolute',
                width: '180px',
                height: '120px',
                background: 'rgba(99, 102, 241, 0.6)',
                borderRadius: '30px 20px 40px 25px',
                top: '80px',
                right: '60px',
                border: '2px solid rgba(255,255,255,0.2)'
              }}></div>
              <div style={{
                position: 'absolute',
                width: '160px',
                height: '100px',
                background: 'rgba(167, 85, 247, 0.7)',
                borderRadius: '25px 35px 20px 45px',
                bottom: '40px',
                left: '80px',
                border: '2px solid rgba(255,255,255,0.3)'
              }}></div>
              
              {/* Map legend indicator */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                fontSize: '10px',
                color: '#ccc'
              }}>
                High ●●●●●● Low
              </div>
            </div>

            {/* Borough Filter */}
            <div style={{
              position: 'absolute',
              bottom: '15px',
              left: '20px',
              right: '20px',
              height: '50px',
              backgroundColor: '#333',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#888' }}>LONDON BOROUGH FILTER</div>
                <div style={{ fontSize: '12px', color: '#fff', marginTop: '2px' }}>Click to filter dashboard</div>
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#8B5CF6'
              }}>
                9.51m
              </div>
              <div style={{ fontSize: '10px', color: '#888' }}>Total Population</div>
            </div>
          </div>

          {/* Top Right: Country of Birth */}
          <div style={{
            gridColumn: '5 / 7',
            gridRow: '2 / 4',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #333',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '10px'
            }}>
              COUNTRY OF BIRTH
            </div>
            
            {/* Donut Chart Simulation */}
            <div style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              margin: '0 auto',
              borderRadius: '50%',
              background: `conic-gradient(
                #8B5CF6 0deg 252deg,
                #333 252deg 360deg
              )`
            }}>
              <div style={{
                position: 'absolute',
                top: '30px',
                left: '30px',
                width: '60px',
                height: '60px',
                backgroundColor: '#1a1a1a',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>70.7%</div>
                <div style={{ fontSize: '8px', color: '#888' }}>UK</div>
              </div>
            </div>

            <div style={{
              marginTop: '10px',
              fontSize: '10px',
              color: '#888',
              textAlign: 'center'
            }}>
              <div>29.3% Outside UK</div>
              <div style={{ color: '#10B981', marginTop: '5px' }}>
                ▲ +8.5% Change from outside UK since 2011
              </div>
            </div>
          </div>

          {/* Top Far Right: Borough Crime Stats */}
          <div style={{
            gridColumn: '7 / 9',
            gridRow: '2 / 4',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #333'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '10px'
            }}>
              BOROUGH'S WITH MOST CRIME | BURGLARY
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '10px', color: '#888' }}>Select Crime Type ▼</div>
              
              {/* Crime bars */}
              {[
                { name: 'Westminster', value: 100 },
                { name: 'Southwark', value: 85 },
                { name: 'Tower Hamlets', value: 75 },
                { name: 'Barnet', value: 65 },
                { name: 'Hackney', value: 60 }
              ].map((borough, index) => (
                <div key={borough.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: index < 3 ? '#8B5CF6' : '#333',
                    borderRadius: '2px'
                  }}></div>
                  <div style={{
                    flex: 1,
                    fontSize: '10px',
                    color: '#fff'
                  }}>
                    {borough.name}
                  </div>
                  <div style={{
                    width: `${borough.value}px`,
                    height: '4px',
                    backgroundColor: index < 3 ? '#8B5CF6' : '#333',
                    borderRadius: '2px'
                  }}></div>
                </div>
              ))}
              
              <div style={{
                marginTop: '5px',
                fontSize: '8px',
                color: '#888',
                textAlign: 'right'
              }}>
                0 1,000 2,000 3,000
              </div>
            </div>
          </div>

          {/* Middle Right: School Education Facilities */}
          <div style={{
            gridColumn: '5 / 7',
            gridRow: '4 / 6',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #333'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '15px'
            }}>
              SCHOOL EDUCATION FACILITIES
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {[
                { label: 'Primary', value: 69, percentage: '61.6%' },
                { label: 'Secondary', value: 20, percentage: '17.9%' },
                { label: 'Other', value: 22, percentage: '19.6%' },
                { label: 'All Through', value: 1, percentage: '0.9%' }
              ].map((item) => (
                <div key={item.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#fff',
                    minWidth: '60px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    backgroundColor: '#333',
                    borderRadius: '4px',
                    margin: '0 10px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: item.percentage,
                      height: '100%',
                      backgroundColor: '#8B5CF6',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#fff',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {item.value}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#888',
                    minWidth: '35px',
                    textAlign: 'right'
                  }}>
                    ({item.percentage})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Far Right: Health Level */}
          <div style={{
            gridColumn: '7 / 9',
            gridRow: '4 / 6',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #333',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '10px'
            }}>
              RECORDED HEALTH LEVEL
            </div>
            <div style={{
              fontSize: '9px',
              color: '#888',
              marginBottom: '15px'
            }}>
              Where respond was classified as Good
            </div>
            
            {/* Gauge Chart Simulation */}
            <div style={{
              position: 'relative',
              width: '100px',
              height: '50px',
              margin: '0 auto',
              borderRadius: '100px 100px 0 0',
              border: '8px solid #333',
              borderBottom: 'none',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '83.9%',
                height: '8px',
                backgroundColor: '#8B5CF6',
                borderRadius: '4px'
              }}></div>
            </div>
            
            <div style={{
              textAlign: 'center',
              marginTop: '10px'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#8B5CF6'
              }}>
                83.9%
              </div>
              <div style={{
                fontSize: '8px',
                color: '#888',
                marginTop: '5px'
              }}>
                0 25 75 100
              </div>
            </div>
          </div>

          {/* Row 3: Bottom Charts (2x2 each) */}
          {/* Car Ownership */}
          <div style={{
            gridColumn: '1 / 3',
            gridRow: '6 / 8',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #333',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '10px'
            }}>
              CAR OWNERSHIP
            </div>
            <div style={{
              fontSize: '9px',
              color: '#888',
              marginBottom: '15px'
            }}>
              Households with one or more vehicles
            </div>
            
            {/* Gauge Chart */}
            <div style={{
              position: 'relative',
              width: '120px',
              height: '60px',
              margin: '0 auto',
              borderRadius: '120px 120px 0 0',
              border: '12px solid #333',
              borderBottom: 'none',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '43.6%',
                height: '12px',
                backgroundColor: '#8B5CF6',
                borderRadius: '6px'
              }}></div>
            </div>
            
            <div style={{
              textAlign: 'center',
              marginTop: '15px'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#8B5CF6'
              }}>
                43.6%
              </div>
              <div style={{
                fontSize: '8px',
                color: '#888',
                marginTop: '5px'
              }}>
                0 25 75 100
              </div>
            </div>
          </div>

          {/* Mean House Price Chart */}
          <div style={{
            gridColumn: '3 / 5',
            gridRow: '6 / 8',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #333'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '5px'
            }}>
              MEAN HOUSE PRICE
            </div>
            <div style={{
              fontSize: '9px',
              color: '#888',
              display: 'flex',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <span>● London</span>
              <span>● National Average</span>
            </div>
            
            {/* Bar Chart Simulation */}
            <div style={{
              height: '80px',
              display: 'flex',
              alignItems: 'end',
              gap: '4px',
              padding: '0 10px'
            }}>
              {[
                { year: '2005', height: '20px' },
                { year: '2007', height: '35px' },
                { year: '2009', height: '25px' },
                { year: '2011', height: '30px' },
                { year: '2013', height: '40px' },
                { year: '2015', height: '50px' },
                { year: '2017', height: '65px' },
                { year: '2019', height: '70px' },
                { year: '2021', height: '60px' },
                { year: '2023', height: '75px' }
              ].map((bar) => (
                <div key={bar.year} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{
                    width: '100%',
                    height: bar.height,
                    backgroundColor: '#8B5CF6',
                    borderRadius: '2px 2px 0 0'
                  }}></div>
                  <div style={{
                    fontSize: '7px',
                    color: '#888',
                    marginTop: '2px',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'center'
                  }}>
                    {bar.year}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              fontSize: '8px',
              color: '#888',
              textAlign: 'left',
              marginTop: '10px'
            }}>
              £0K £200K £400K
            </div>
          </div>

          {/* All Ethnicity Types */}
          <div style={{
            gridColumn: '5 / 7',
            gridRow: '6 / 8',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #333'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '10px'
            }}>
              ALL ETHNICITY TYPES
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '10px', color: '#888' }}>Select Chart Type ▼</div>
              <div style={{
                display: 'flex',
                gap: '5px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#8B5CF6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>△</div>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#333',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>○</div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {[
                { label: 'White', percentage: '62.4%', width: '85%' },
                { label: 'Black', percentage: '15.9%', width: '25%' },
                { label: 'Asian', percentage: '11.1%', width: '18%' },
                { label: 'Mixed', percentage: '5.5%', width: '10%' },
                { label: 'Other', percentage: '5.1%', width: '8%' }
              ].map((item) => (
                <div key={item.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#fff',
                    minWidth: '40px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '6px',
                    backgroundColor: '#333',
                    borderRadius: '3px',
                    margin: '0 8px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: item.width,
                      height: '100%',
                      backgroundColor: '#8B5CF6',
                      borderRadius: '3px'
                    }}></div>
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#888',
                    minWidth: '35px',
                    textAlign: 'right'
                  }}>
                    {item.percentage}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              fontSize: '8px',
              color: '#888',
              marginTop: '8px'
            }}>
              BAME = Black, Asian & Minority Ethnicity
            </div>
          </div>

          {/* Map Layers */}
          <div style={{
            gridColumn: '7 / 9',
            gridRow: '6 / 8',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #333'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '15px'
            }}>
              MAP LAYERS
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                padding: '10px',
                backgroundColor: '#333',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: '#888' }}>Underground Stations</div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '5px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    color: '#fff'
                  }}>
                    <input 
                      type="checkbox" 
                      style={{
                        width: '12px',
                        height: '12px'
                      }}
                    />
                    OFF
                  </label>
                </div>
              </div>
              
              <div style={{
                padding: '10px',
                backgroundColor: '#333',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: '#888' }}>Secondary Schools</div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '5px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    color: '#fff'
                  }}>
                    <input 
                      type="checkbox" 
                      style={{
                        width: '12px',
                        height: '12px'
                      }}
                    />
                    OFF
                  </label>
                </div>
              </div>
            </div>
            
            <div style={{
              marginTop: '15px',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', color: '#888' }}>INFORMATION</div>
              <div style={{
                marginTop: '5px',
                fontSize: '18px',
                color: '#fff'
              }}>ⓘ</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardPlayground>
  );
};

export default Dashboard3;
