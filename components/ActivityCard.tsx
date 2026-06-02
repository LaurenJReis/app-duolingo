import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isCompleted: boolean;
  isLocked: boolean;
  progress?: number; // 0-100
  icon?: string;
  estimatedTime?: number; // in minutes
}

interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'large';
}

const getDifficultyColor = (difficulty: string): [string, string] => {
  switch (difficulty) {
    case 'easy':
      return ['#A8E6CF', '#56AB91'];
    case 'medium':
      return ['#FFD3B6', '#FFAA64'];
    case 'hard':
      return ['#FF8B94', '#D64545'];
    default:
      return ['#A8D5FF', '#2E8BC0'];
  }
};

const getDifficultyLabel = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy':
      return 'Fácil';
    case 'medium':
      return 'Médio';
    case 'hard':
      return 'Difícil';
    default:
      return difficulty;
  }
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onPress,
  disabled = false,
  variant = 'default',
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (!disabled && !activity.isLocked) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!activity.isLocked && !disabled && onPress) {
      onPress();
    }
  };

  const [color1, color2] = getDifficultyColor(activity.difficulty);
  const isLocked = activity.isLocked && !activity.isCompleted;

  const styles = getStyles(variant);

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLocked || disabled}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={isLocked ? ['#CCCCCC', '#999999'] : [color1, color2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, isLocked && styles.locked]}
          >
            <View style={styles.compactContent}>
              <Text style={styles.compactTitle}>{activity.title}</Text>
              <View style={styles.compactFooter}>
                <Text style={styles.xpText}>+{activity.xpReward} XP</Text>
                {isLocked && <Text style={styles.lockText}>🔒</Text>}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  if (variant === 'large') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLocked || disabled}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={isLocked ? ['#CCCCCC', '#999999'] : [color1, color2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, styles.largeContainer, isLocked && styles.locked]}
          >
            <View style={styles.largeContent}>
              <View style={styles.headerSection}>
                <View>
                  <Text style={styles.largeTitle}>{activity.title}</Text>
                  {activity.description && (
                    <Text style={styles.description}>{activity.description}</Text>
                  )}
                </View>
                {activity.isCompleted && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Dificuldade</Text>
                  <Text style={styles.statValue}>{getDifficultyLabel(activity.difficulty)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Recompensa</Text>
                  <Text style={styles.statValue}>+{activity.xpReward} XP</Text>
                </View>
                {activity.estimatedTime && (
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Tempo</Text>
                    <Text style={styles.statValue}>{activity.estimatedTime}m</Text>
                  </View>
                )}
              </View>

              {activity.progress !== undefined && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${activity.progress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{Math.round(activity.progress || 0)}%</Text>
                </View>
              )}

              {isLocked && (
                <View style={styles.lockedOverlay}>
                  <Text style={styles.lockedIcon}>🔒</Text>
                  <Text style={styles.lockedText}>Desbloqueie completando a lição anterior</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isLocked || disabled}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={isLocked ? ['#CCCCCC', '#999999'] : [color1, color2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, isLocked && styles.locked]}
        >
          <View style={styles.content}>
            <View style={styles.leftSection}>
              <Text style={styles.title}>{activity.title}</Text>
              {activity.description && (
                <Text style={styles.subtitle}>{activity.description}</Text>
              )}
              <View style={styles.footer}>
                <Text style={styles.difficulty}>
                  {getDifficultyLabel(activity.difficulty)}
                </Text>
                <Text style={styles.xp}>+{activity.xpReward} XP</Text>
              </View>
            </View>

            <View style={styles.rightSection}>
              {activity.isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              )}
              {isLocked && (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              )}
              {!activity.isCompleted && !isLocked && (
                <Text style={styles.arrow}>→</Text>
              )}
            </View>
          </View>

          {activity.progress !== undefined && !isLocked && (
            <View style={styles.miniProgressBar}>
              <View
                style={[
                  styles.miniProgressFill,
                  { width: `${activity.progress}%` },
                ]}
              />
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const getStyles = (variant: string) => {
  if (variant === 'compact') {
    return StyleSheet.create({
      container: {
        borderRadius: 12,
        padding: 12,
        marginVertical: 6,
        marginHorizontal: 8,
      },
      locked: {
        opacity: 0.6,
      },
      compactContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      compactTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
      },
      compactFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      xpText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
      lockText: {
        fontSize: 14,
      },
    });
  }

  if (variant === 'large') {
    return StyleSheet.create({
      container: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 0,
      },
      largeContainer: {
        minHeight: 240,
      },
      locked: {
        opacity: 0.6,
      },
      largeContent: {
        gap: 12,
      },
      headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      },
      largeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
      },
      description: {
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 2,
      },
      badge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      badgeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
      statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
      },
      stat: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        padding: 8,
      },
      statLabel: {
        fontSize: 11,
        color: '#FFFFFF',
        opacity: 0.8,
        marginBottom: 2,
      },
      statValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
      },
      progressSection: {
        gap: 6,
      },
      progressBar: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 3,
        overflow: 'hidden',
      },
      progressFill: {
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 3,
      },
      progressText: {
        fontSize: 11,
        color: '#FFFFFF',
        opacity: 0.8,
      },
      lockedOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        gap: 4,
      },
      lockedIcon: {
        fontSize: 24,
      },
      lockedText: {
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'center',
      },
      content: {},
      leftSection: {},
      rightSection: {},
      title: {},
      subtitle: {},
      footer: {},
      difficulty: {},
      xp: {},
      completedBadge: {},
      completedText: {},
      lockBadge: {},
      lockIcon: {},
      arrow: {},
      miniProgressBar: {},
      miniProgressFill: {},
    });
  }

  // Default styles
  return StyleSheet.create({
    container: {
      borderRadius: 14,
      padding: 14,
      marginVertical: 8,
      marginHorizontal: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    locked: {
      opacity: 0.6,
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftSection: {
      flex: 1,
      marginRight: 12,
    },
    rightSection: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      height: 40,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.85,
      marginBottom: 6,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    difficulty: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
      opacity: 0.9,
    },
    xp: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    completedBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    completedText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    lockBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    lockIcon: {
      fontSize: 18,
    },
    arrow: {
      fontSize: 20,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    miniProgressBar: {
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 2,
      marginTop: 10,
      overflow: 'hidden',
    },
    miniProgressFill: {
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderRadius: 2,
    },
    compactContent: {},
    compactTitle: {},
    compactFooter: {},
    xpText: {},
    lockText: {},
  });
};
