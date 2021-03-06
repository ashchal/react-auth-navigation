import * as React from "react";
import {
  BrowserRouter,
  HashRouter,
  Switch,
  Route,
  NavLink as InternalNavLink,
  NavLinkProps as InternalNavLinkProps,
} from "react-router-dom";
import { PrivateRoute, PublicRoute } from "./Modules";
import {
  AuthProviderParams,
  NavigationProviderParams,
  NavigationConfigParams,
  PublicPathParams,
  PrivatePathParams,
} from "./Types";
import { AuthContext, NavigationContext } from "./Context";
import { getParsedPaths, reOrderPaths } from "./Utils";

// Auth
export const Auth = {
  Provider: (props: AuthProviderParams) => {
    const { children, config, state } = props;
    const { routerType } = React.useContext(NavigationContext);
    return (
      <AuthContext.Provider value={{ ...config, ...state }}>
        {routerType === "hash" ? (
          <HashRouter>{children}</HashRouter>
        ) : (
          <BrowserRouter>{children}</BrowserRouter>
        )}
      </AuthContext.Provider>
    );
  },
  Screens: ({ path }: { path?: string }) => {
    const {
      publicPaths: PUBLIC_PATHS,
      privatePaths: PRIVATE_PATHS,
    } = React.useContext(NavigationContext);

    if (!!path) {
      const parser = getParsedPaths("nestedPaths");
      const parsedPublicPaths = parser(PUBLIC_PATHS);
      const parsedPrivatePaths = parser(PRIVATE_PATHS);

      const nestedPublicPathsArray = parsedPublicPaths.filter(
        (val: any) => val.path === path
      );
      const nestedPrivatePathsArray = parsedPrivatePaths.filter(
        (val: any) => val.path === path
      );
      const nestedPublicRoutes = parser(nestedPublicPathsArray);
      const nestedPrivateRoutes = parser(nestedPrivatePathsArray);
      const filteredNestedPublicRoutes = nestedPublicRoutes.filter(
        (val: any) => val.path !== path
      );
      const filteredNestedPrivateRoutes = nestedPrivateRoutes.filter(
        (val: any) => val.path !== path
      );

      return (
        <Switch>
          {
            // PUBLIC ROUTES
            filteredNestedPublicRoutes.length &&
              filteredNestedPublicRoutes
                .filter(({ path }: PublicPathParams) => path !== null) // Other than Not Found Page
                .map(
                  (
                    {
                      path,
                      component,
                      restricted,
                      exact = true,
                      nestedPaths,
                    }: PublicPathParams,
                    index: number
                  ) => {
                    let _exact = exact;
                    if (!!nestedPaths) {
                      _exact = false;
                    }

                    return (
                      <PublicRoute
                        key={index}
                        path={path}
                        component={component}
                        restricted={!!restricted}
                        exact={_exact}
                      />
                    );
                  }
                )
          }
          {
            // PRIVATE ROUTES
            filteredNestedPrivateRoutes.length &&
              filteredNestedPrivateRoutes.map(
                (
                  {
                    path,
                    component,
                    exact = true,
                    nestedPaths,
                  }: PrivatePathParams,
                  index: number
                ) => {
                  let _exact = exact;
                  if (!!nestedPaths) {
                    _exact = false;
                  }

                  return (
                    <PrivateRoute
                      key={index}
                      path={path}
                      component={component}
                      exact={_exact}
                    />
                  );
                }
              )
          }
        </Switch>
      );
    } else {
      return (
        <Switch>
          {
            // PUBLIC ROUTES
            PUBLIC_PATHS.length &&
              PUBLIC_PATHS.filter(({ path }: PublicPathParams) => path !== null) // Other than Not Found Page
                .map(
                  (
                    {
                      path,
                      component,
                      restricted,
                      exact = true,
                      nestedPaths,
                    }: PublicPathParams,
                    index: number
                  ) => {
                    let _exact = exact;
                    if (!!nestedPaths) {
                      _exact = false;
                    }
                    return (
                      <PublicRoute
                        key={index}
                        path={path}
                        component={component}
                        restricted={!!restricted}
                        exact={_exact}
                      />
                    );
                  }
                )
          }
          {
            // PRIVATE ROUTES
            PRIVATE_PATHS.length &&
              PRIVATE_PATHS.map(
                (
                  {
                    path,
                    component,
                    exact = true,
                    nestedPaths,
                  }: PrivatePathParams,
                  index: number
                ) => {
                  let _exact = exact;
                  if (!!nestedPaths) {
                    _exact = false;
                  }
                  return (
                    <PrivateRoute
                      key={index}
                      path={path}
                      component={component}
                      exact={_exact}
                    />
                  );
                }
              )
          }

          {
            // NOT FOUND
            PUBLIC_PATHS.length &&
              PUBLIC_PATHS.filter(
                ({ path }: PublicPathParams) => path === null
              ).map(
                ({ component: Component }: PublicPathParams, index: number) =>
                  index === 0 && (
                    <Route key={index} render={() => <Component />} />
                  )
              )
          }
        </Switch>
      );
    }
  },
};

// Navigation
export const Navigation = {
  Provider: (props: NavigationProviderParams) => {
    const {
      children,
      privatePaths,
      publicPaths,
      userRoles,
      routerType,
    } = props;

    const parser = getParsedPaths("subPaths");

    const parsedPrivatePaths = parser(privatePaths);
    const parsedPublicPaths = parser(publicPaths);

    const _privatePaths = reOrderPaths(parsedPrivatePaths);
    const _publicPaths = reOrderPaths(parsedPublicPaths);

    return (
      <NavigationContext.Provider
        value={{
          privatePaths: _privatePaths,
          publicPaths: _publicPaths,
          userRoles: userRoles,
          origPrivatePaths: parsedPrivatePaths,
          origPublicPaths: parsedPublicPaths,
          routerType,
        }}
      >
        {children}
      </NavigationContext.Provider>
    );
  },
};

export const withNavigation = (
  Component: React.ComponentType,
  navigationConfig: NavigationConfigParams
) => {
  const {
    publicPaths,
    privatePaths,
    userRoles,
    routerType = "browser",
  } = navigationConfig;
  return function (props: any) {
    return (
      <Navigation.Provider
        {...{ routerType, publicPaths, privatePaths, userRoles }}
      >
        <Component {...props} />
      </Navigation.Provider>
    );
  };
};

// NavLink Component as ActiveLink
export const ActiveLink = (
  props: React.PropsWithoutRef<InternalNavLinkProps> &
    React.RefAttributes<HTMLAnchorElement>
) => {
  return <InternalNavLink {...props} />;
};
